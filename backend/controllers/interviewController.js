// backend/controllers/interviewController.js
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const { sendInterviewEmail, sendResultEmail } = require('../services/emailService');

// ============================================
// 1. CREATE INTERVIEW (When student is shortlisted)
// ============================================
exports.createInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const recruiterId = req.user.id;

    console.log(`🔍 Creating interview for application: ${applicationId}`);

    // Get application details
    const application = await Application.findById(applicationId)
      .populate('internship')
      .populate('student');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if interview already exists
    const existingInterview = await Interview.findOne({ applicationId });
    if (existingInterview) {
      return res.status(400).json({
        success: false,
        message: 'Interview already scheduled for this application'
      });
    }

    // Get internship selection process rounds
    const internship = application.internship;
    const selectionRounds = internship.selectionProcess || [];

    if (selectionRounds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No selection rounds defined for this internship'
      });
    }

    console.log(`📋 Found ${selectionRounds.length} rounds from internship`);

    // Create interview rounds from internship selection process
    const rounds = selectionRounds.map((round, index) => ({
      roundNumber: index + 1,
      roundType: round.type,
      duration: round.duration || '60 mins',
      status: 'pending',
      result: 'pending',
      mode: 'online', // Default, will be updated when scheduling
      emailSent: false
    }));

    // Create interview
    const interview = new Interview({
      applicationId,
      studentId: application.student._id,
      internshipId: internship._id,
      recruiterId,
      rounds,
      currentRound: 1,
      overallStatus: 'in_progress'
    });

    await interview.save();

    console.log(`✅ Interview created with ID: ${interview._id}`);

    res.status(201).json({
      success: true,
      message: 'Interview process started successfully',
      data: { interview }
    });

  } catch (error) {
    console.error('❌ Error creating interview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 2. GET INTERVIEW BY ID
// ============================================
exports.getInterviewById = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const interview = await Interview.findById(interviewId)
      .populate('studentId', 'fullName email phone profilePicture education skills')
      .populate('recruiterId', 'fullName email department designation')
      .populate('internshipId', 'title department companyName workMode location')
      .populate('applicationId');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (userRole === 'student' && interview.studentId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    if (userRole === 'recruiter' && interview.recruiterId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    res.status(200).json({
      success: true,
      data: { interview }
    });

  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 3. GET INTERVIEW BY APPLICATION
// ============================================
exports.getInterviewByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const interview = await Interview.findOne({ applicationId })
      .populate('studentId', 'fullName email')
      .populate('internshipId', 'title department');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'No interview found for this application'
      });
    }

    res.status(200).json({
      success: true,
      data: { interview }
    });

  } catch (error) {
    console.error('Error fetching interview by application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 4. GET ALL INTERVIEWS FOR RECRUITER
// ============================================
exports.getRecruiterInterviews = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { status, type } = req.query;

    let query = { recruiterId };
    
    // Filter by overall status if provided
    if (status && status !== 'all') {
      if (status === 'pending') {
        // Interviews with any round pending
        query['rounds.status'] = 'pending';
      } else if (status === 'scheduled') {
        // Interviews with any round scheduled
        query['rounds.status'] = 'scheduled';
      } else if (status === 'completed') {
        // Interviews with all rounds completed
        query['rounds.status'] = 'completed';
        query['overallStatus'] = { $in: ['in_progress', 'selected', 'rejected'] };
      }
    }

    // Filter by round type if provided
    if (type && type !== 'all') {
      query['rounds.roundType'] = type;
    }

    const interviews = await Interview.find(query)
      .populate('studentId', 'fullName email profilePicture education')
      .populate('internshipId', 'title department')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      total: interviews.length,
      pendingSchedule: 0,
      upcoming: 0,
      pendingFeedback: 0,
      completed: 0,
      selected: 0,
      rejected: 0
    };

    interviews.forEach(interview => {
      // Count interviews with pending rounds
      const hasPending = interview.rounds.some(r => r.status === 'pending');
      if (hasPending) stats.pendingSchedule++;

      // Count interviews with scheduled upcoming rounds
      const now = new Date();
      const hasUpcoming = interview.rounds.some(r => 
        r.status === 'scheduled' && new Date(r.scheduledDate) > now
      );
      if (hasUpcoming) stats.upcoming++;

      // Count interviews with completed rounds pending feedback
      const hasCompleted = interview.rounds.some(r => 
        r.status === 'completed' && r.result === 'pending'
      );
      if (hasCompleted) stats.pendingFeedback++;

      // Count completed interviews
      const allCompleted = interview.rounds.every(r => r.status === 'completed');
      if (allCompleted) stats.completed++;

      // Count final outcomes
      if (interview.overallStatus === 'selected') stats.selected++;
      if (interview.overallStatus === 'rejected') stats.rejected++;
    });

    res.status(200).json({
      success: true,
      data: { interviews, stats }
    });

  } catch (error) {
    console.error('Error fetching recruiter interviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 5. GET STUDENT'S INTERVIEWS
// ============================================
exports.getStudentInterviews = async (req, res) => {
  try {
    const studentId = req.user.id;

    const interviews = await Interview.find({ studentId })
      .populate('internshipId', 'title department companyName')
      .populate('recruiterId', 'fullName email department')
      .sort({ createdAt: -1 });

    // Separate upcoming and past
    const now = new Date();
    const upcoming = [];
    const past = [];

    interviews.forEach(interview => {
      const hasUpcoming = interview.rounds.some(round => 
        round.status === 'scheduled' && new Date(round.scheduledDate) > now
      );
      
      if (hasUpcoming) {
        upcoming.push(interview);
      } else {
        past.push(interview);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        upcoming,
        past,
        total: interviews.length
      }
    });

  } catch (error) {
    console.error('Error fetching student interviews:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 6. SCHEDULE INTERVIEW ROUND
// ============================================
exports.scheduleRound = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const {
      roundNumber,
      scheduledDate,
      scheduledTime,
      mode,
      // Online fields
      platform,
      meetingLink,
      testLink,
      testPlatform,
      accessCode,
      instructions,
      // Offline fields
      venue,
      address,
      city,
      landmark,
      roomNumber,
      floor,
      contactPerson,
      // Assignment fields
      assignmentTitle,
      assignmentDescription,
      assignmentRequirements,
      assignmentTechnologies,
      submissionPlatform,
      deadline
    } = req.body;

    const interview = await Interview.findById(interviewId)
      .populate('studentId', 'fullName email')
      .populate('internshipId', 'title');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Find the round
    const round = interview.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Update common fields
    round.status = 'scheduled';
    round.scheduledDate = scheduledDate;
    round.scheduledTime = scheduledTime;
    round.scheduledAt = new Date();
    round.mode = mode;

    // Set mode-specific details
    if (mode === 'online') {
      round.onlineDetails = {
        platform: platform || 'Google Meet',
        meetingLink: meetingLink || generateMeetingLink(platform),
        testLink,
        testPlatform,
        accessCode,
        instructions
      };
    } 
    else if (mode === 'offline') {
      round.offlineDetails = {
        venue,
        address,
        city,
        landmark,
        roomNumber,
        floor,
        contactPerson: contactPerson ? {
          name: contactPerson.name,
          phone: contactPerson.phone,
          email: contactPerson.email,
          designation: contactPerson.designation
        } : undefined
      };
    } 
    else if (mode === 'assignment') {
      round.assignmentDetails = {
        title: assignmentTitle,
        description: assignmentDescription,
        requirements: assignmentRequirements ? assignmentRequirements.split('\n') : [],
        technologies: assignmentTechnologies ? assignmentTechnologies.split(',').map(t => t.trim()) : [],
        submissionPlatform,
        evaluationCriteria: []
      };
      round.deadline = deadline;
    }

    await interview.save();

    // Send email notification
    try {
      await sendInterviewEmail(
        interview.studentId.email,
        interview.studentId.fullName,
        interview.internshipId.title,
        round
      );
      round.emailSent = true;
      round.emailSentAt = new Date();
      await interview.save();
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: `Round ${roundNumber} scheduled successfully`,
      data: { interview }
    });

  } catch (error) {
    console.error('Error scheduling round:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to generate meeting link
const generateMeetingLink = (platform) => {
  const randomId = Math.random().toString(36).substring(2, 10);
  switch(platform) {
    case 'Google Meet':
      return `https://meet.google.com/${randomId}`;
    case 'Zoom':
      return `https://zoom.us/j/${randomId}`;
    case 'Microsoft Teams':
      return `https://teams.microsoft.com/l/meetup-join/${randomId}`;
    default:
      return `https://meet.google.com/${randomId}`;
  }
};

// ============================================
// 7. SUBMIT ROUND RESULT & FEEDBACK
// ============================================
exports.submitRoundResult = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const {
      roundNumber,
      result,
      score,
      percentage,
      feedback,
      nextRound
    } = req.body;

    const interview = await Interview.findById(interviewId)
      .populate('studentId', 'fullName email')
      .populate('internshipId', 'title');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Find the round
    const round = interview.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Update round with result
    round.status = 'completed';
    round.result = result;
    round.completedAt = new Date();
    
    if (score !== undefined) round.score = score;
    if (percentage !== undefined) round.percentage = percentage;
    
    if (feedback) {
      round.feedback = {
        ...feedback,
        submittedAt: new Date()
      };
    }

    // Determine next steps based on result
    if (result === 'pass') {
      if (interview.rounds.length > roundNumber) {
        // There is a next round
        interview.currentRound = roundNumber + 1;
        
        // Send email about passing
        await sendResultEmail(
          interview.studentId.email,
          interview.studentId.fullName,
          interview.internshipId.title,
          'pass',
          round.roundType
        );
      } else {
        // This was the last round - student selected!
        interview.overallStatus = 'selected';
        interview.finalDecision = {
          madeBy: req.user.id,
          madeAt: new Date(),
          decision: 'selected',
          comments: feedback?.detailedNotes || 'Selected after all rounds'
        };
        
        // Update application status
        await Application.findByIdAndUpdate(
          interview.applicationId,
          { status: 'accepted' }
        );
        
        // Send selection email
        await sendResultEmail(
          interview.studentId.email,
          interview.studentId.fullName,
          interview.internshipId.title,
          'selected',
          'final'
        );
      }
    } else if (result === 'fail') {
      // Student failed this round - reject
      interview.overallStatus = 'rejected';
      interview.finalDecision = {
        madeBy: req.user.id,
        madeAt: new Date(),
        decision: 'rejected',
        comments: feedback?.detailedNotes || `Rejected after round ${roundNumber}`
      };
      
      // Update application status
      await Application.findByIdAndUpdate(
        interview.applicationId,
        { status: 'rejected' }
      );
      
      // Send rejection email
      await sendResultEmail(
        interview.studentId.email,
        interview.studentId.fullName,
        interview.internshipId.title,
        'reject',
        round.roundType
      );
    }

    await interview.save();

    res.status(200).json({
      success: true,
      message: `Round ${roundNumber} result submitted successfully`,
      data: { interview }
    });

  } catch (error) {
    console.error('Error submitting round result:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 8. SUBMIT ASSIGNMENT (Student)
// ============================================
exports.submitAssignment = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { roundNumber, submissionLink, notes } = req.body;
    const studentId = req.user.id;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify student owns this interview
    if (interview.studentId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const round = interview.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Check deadline
    const now = new Date();
    const deadline = new Date(round.deadline);
    const submittedOnTime = now <= deadline;

    round.studentSubmission = {
      submittedAt: now,
      submissionLink,
      notes,
      submittedOnTime
    };

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submittedAt: now,
        submittedOnTime
      }
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 9. RESCHEDULE ROUND
// ============================================
exports.rescheduleRound = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { roundNumber, newDate, newTime, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const interview = await Interview.findById(interviewId)
      .populate('studentId', 'fullName email')
      .populate('recruiterId', 'fullName email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    const round = interview.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Save original schedule for history
    const originalDate = round.scheduledDate;
    const originalTime = round.scheduledTime;

    // Update round
    round.status = 'rescheduled';
    round.scheduledDate = newDate;
    round.scheduledTime = newTime;
    round.scheduledAt = new Date();

    // Add to reschedule history
    if (!round.rescheduleHistory) round.rescheduleHistory = [];
    round.rescheduleHistory.push({
      requestedBy: userRole === 'recruiter' ? 'recruiter' : 'student',
      requestedAt: new Date(),
      originalDate,
      originalTime,
      newDate,
      newTime,
      reason,
      approved: true,
      approvedAt: new Date()
    });

    await interview.save();

    // Send notification email
    // (You can implement this based on who requested)

    res.status(200).json({
      success: true,
      message: `Round ${roundNumber} rescheduled successfully`
    });

  } catch (error) {
    console.error('Error rescheduling round:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 10. GET INTERVIEW STATS FOR RECRUITER
// ============================================
exports.getInterviewStats = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const interviews = await Interview.find({ recruiterId });

    const stats = {
      total: interviews.length,
      byStatus: {
        in_progress: 0,
        selected: 0,
        rejected: 0,
        on_hold: 0
      },
      byRound: {
        pending: 0,
        scheduled: 0,
        completed: 0
      },
      conversionRate: 0
    };

    interviews.forEach(interview => {
      // Overall status
      stats.byStatus[interview.overallStatus]++;

      // Round statuses
      interview.rounds.forEach(round => {
        stats.byRound[round.status]++;
      });
    });

    // Calculate conversion rate (selected / total completed)
    const completed = interviews.filter(i => 
      i.rounds.every(r => r.status === 'completed')
    ).length;
    
    if (completed > 0) {
      stats.conversionRate = (stats.byStatus.selected / completed) * 100;
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching interview stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};