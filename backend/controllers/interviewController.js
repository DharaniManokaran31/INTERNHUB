const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const { createNotification } = require('./notificationController');
const { 
  sendInterviewScheduledEmail, 
  sendInterviewRescheduleEmail,
  sendInterviewResponseEmail,
  sendResultEmail 
} = require('../services/emailService');

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
      .populate('internshipId')
      .populate('studentId');

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
    const internship = application.internshipId;
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
      roundType: round.type || round.roundType,
      duration: round.duration || '60 mins',
      status: 'pending',
      result: 'pending',
      mode: 'online',
      emailSent: false,
      rescheduleHistory: []
    }));

    // Create interview
    const interview = new Interview({
      applicationId,
      studentId: application.studentId._id,
      internshipId: internship._id,
      recruiterId,
      rounds,
      currentRound: 1,
      overallStatus: 'in_progress'
    });

    // Save with error handling
    await interview.save();

    console.log(`✅ Interview created with ID: ${interview._id}`);

    // ✅ FIXED: Non-blocking notification creation
    // This runs in background and won't affect the response
    (async () => {
      try {
        await createNotification({
          recipientId: application.studentId._id,
          recipientModel: 'Student',
          type: 'interview_scheduled',
          title: 'Interview Process Started',
          message: `Your interview process for ${internship.title} has been initiated`,
          data: {
            interviewId: interview._id,
            applicationId,
            internshipId: internship._id,
            internshipTitle: internship.title
          }
        });
      } catch (notifError) {
        console.log('⚠️ Background notification failed (non-critical):', notifError.message);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Interview process started successfully',
      data: { interview }
    });

  } catch (error) {
    console.error('❌ Error creating interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create interview'
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
      .populate('studentId', 'fullName email phone profilePicture currentEducation skills')
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
    const isStudent = userRole === 'student' && interview.studentId?._id.toString() === userId;
    const isRecruiter = userRole === 'recruiter' && interview.recruiterId?._id.toString() === userId;
    const isHR = userRole === 'hr';

    if (!isStudent && !isRecruiter && !isHR) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    // Add virtual fields for UI
    const interviewObj = interview.toObject();
    interviewObj.nextRound = interview.nextRound;
    interviewObj.progressPercentage = interview.progressPercentage;

    res.status(200).json({
      success: true,
      data: { interview: interviewObj }
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
    const { status, type, page = 1, limit = 10 } = req.query;

    let query = { recruiterId };
    
    // Filter by overall status if provided
    if (status && status !== 'all') {
      if (status === 'pending') {
        query['rounds.status'] = 'pending';
      } else if (status === 'scheduled') {
        query['rounds.status'] = 'scheduled';
      } else if (status === 'completed') {
        query['overallStatus'] = { $in: ['selected', 'rejected'] };
      }
    }

    // Filter by round type if provided
    if (type && type !== 'all') {
      query['rounds.roundType'] = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const interviews = await Interview.find(query)
      .populate('studentId', 'fullName email profilePicture currentEducation')
      .populate('internshipId', 'title department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interview.countDocuments(query);

    // Calculate stats
    const allInterviews = await Interview.find({ recruiterId });
    const stats = {
      total: allInterviews.length,
      pendingSchedule: 0,
      upcoming: 0,
      pendingFeedback: 0,
      completed: 0,
      selected: 0,
      rejected: 0
    };

    const now = new Date();
    allInterviews.forEach(interview => {
      // Count interviews with pending rounds
      const hasPending = interview.rounds.some(r => r.status === 'pending');
      if (hasPending) stats.pendingSchedule++;

      // Count interviews with scheduled upcoming rounds
      const hasUpcoming = interview.rounds.some(r => 
        r.status === 'scheduled' && new Date(r.scheduledDate) > now
      );
      if (hasUpcoming) stats.upcoming++;

      // Count interviews with completed rounds pending feedback
      const hasCompleted = interview.rounds.some(r => 
        r.status === 'completed' && r.result === 'pending'
      );
      if (hasCompleted) stats.pendingFeedback++;

      // Count final outcomes
      if (interview.overallStatus === 'selected') stats.selected++;
      if (interview.overallStatus === 'rejected') stats.rejected++;
    });

    // Calculate conversion rate
    const totalDecided = stats.selected + stats.rejected;
    stats.conversionRate = totalDecided > 0 
      ? Math.round((stats.selected / totalDecided) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: { 
        interviews, 
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
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
    const roundData = req.body;
    const recruiterId = req.user.id;

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
    const round = interview.rounds.find(r => r.roundNumber === roundData.roundNumber);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Round not found'
      });
    }

    // Update round with schedule details
    round.status = 'scheduled';
    round.scheduledDate = roundData.scheduledDate;
    round.scheduledTime = roundData.scheduledTime;
    round.scheduledAt = new Date();
    round.mode = roundData.mode || 'online';
    round.duration = roundData.duration || '60 mins';

    // Set mode-specific details
    if (roundData.mode === 'online') {
      round.onlineDetails = {
        platform: roundData.platform || 'Google Meet',
        meetingLink: roundData.meetingLink || generateMeetingLink(roundData.platform),
        testLink: roundData.testLink,
        testPlatform: roundData.testPlatform,
        accessCode: roundData.accessCode,
        instructions: roundData.instructions
      };
    } 
    else if (roundData.mode === 'offline') {
      round.offlineDetails = {
        venue: roundData.venue,
        address: roundData.address,
        city: roundData.city,
        landmark: roundData.landmark,
        roomNumber: roundData.roomNumber,
        floor: roundData.floor,
        contactPerson: roundData.contactPerson ? {
          name: roundData.contactPerson.name,
          phone: roundData.contactPerson.phone,
          email: roundData.contactPerson.email,
          designation: roundData.contactPerson.designation
        } : undefined
      };
    } 
    else if (roundData.mode === 'assignment') {
      round.assignmentDetails = {
        title: roundData.assignmentTitle,
        description: roundData.assignmentDescription,
        requirements: roundData.assignmentRequirements ? roundData.assignmentRequirements.split('\n') : [],
        technologies: roundData.assignmentTechnologies ? roundData.assignmentTechnologies.split(',').map(t => t.trim()) : [],
        submissionPlatform: roundData.submissionPlatform,
        evaluationCriteria: []
      };
      round.deadline = roundData.deadline;
    }

    await interview.save();

    // Send email notification (non-blocking)
    (async () => {
      try {
        await sendInterviewScheduledEmail(
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
      }
    })();

    // Create notification for student (non-blocking)
    (async () => {
      try {
        await createNotification({
          recipientId: interview.studentId._id,
          recipientModel: 'Student',
          type: 'interview_scheduled',
          title: `Interview Scheduled - Round ${round.roundNumber}`,
          message: `Your ${round.roundType} round for ${interview.internshipId.title} has been scheduled`,
          data: {
            interviewId: interview._id,
            roundNumber: round.roundNumber,
            scheduledDate: round.scheduledDate,
            scheduledTime: round.scheduledTime,
            mode: round.mode
          }
        });
      } catch (notifError) {
        console.log('⚠️ Notification failed (non-critical):', notifError.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: `Round ${round.roundNumber} scheduled successfully`,
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
      feedback
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
        rating: feedback.rating,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        technicalSkills: feedback.technicalSkills,
        communicationSkills: feedback.communicationSkills,
        problemSolving: feedback.problemSolving,
        overallImpression: feedback.overallImpression,
        detailedNotes: feedback.detailedNotes,
        recommendedNextRound: feedback.recommendedNextRound !== false,
        submittedAt: new Date()
      };
    }

    // Determine next steps based on result
    if (result === 'pass') {
      if (interview.rounds.length > roundNumber) {
        // There is a next round
        interview.currentRound = roundNumber + 1;
        
        // Send email about passing (non-blocking)
        (async () => {
          try {
            await sendResultEmail(
              interview.studentId.email,
              interview.studentId.fullName,
              interview.internshipId.title,
              'pass',
              round.roundType
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }
        })();

        // Create notification for next round (non-blocking)
        (async () => {
          try {
            await createNotification({
              recipientId: interview.studentId._id,
              recipientModel: 'Student',
              type: 'interview_result',
              title: `You passed Round ${roundNumber}!`,
              message: `Congratulations! You've been shortlisted for the next round of ${interview.internshipId.title}`,
              data: {
                interviewId: interview._id,
                roundNumber: roundNumber + 1,
                nextRoundType: interview.rounds[roundNumber].roundType
              }
            });
          } catch (notifError) {
            console.log('⚠️ Notification failed (non-critical):', notifError.message);
          }
        })();
      } else {
        // This was the last round - student selected!
        interview.overallStatus = 'selected';
        
        // Update application status
        await Application.findByIdAndUpdate(
          interview.applicationId,
          { 
            status: 'accepted',
            $push: {
              timeline: {
                status: 'accepted',
                comment: 'Selected after interview process',
                updatedAt: new Date(),
                updatedBy: req.user.id
              }
            }
          }
        );
        
        // Send selection email (non-blocking)
        (async () => {
          try {
            await sendResultEmail(
              interview.studentId.email,
              interview.studentId.fullName,
              interview.internshipId.title,
              'selected',
              'final'
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }
        })();

        // Create selection notification (non-blocking)
        (async () => {
          try {
            await createNotification({
              recipientId: interview.studentId._id,
              recipientModel: 'Student',
              type: 'interview_result',
              title: '🎉 Congratulations! You\'re Selected!',
              message: `We're pleased to inform you that you've been selected for the ${interview.internshipId.title} internship!`,
              data: {
                interviewId: interview._id,
                applicationId: interview.applicationId,
                internshipId: interview.internshipId._id
              }
            });
          } catch (notifError) {
            console.log('⚠️ Notification failed (non-critical):', notifError.message);
          }
        })();
      }
    } else if (result === 'fail') {
      // Student failed this round - reject
      interview.overallStatus = 'rejected';
      
      // Update application status
      await Application.findByIdAndUpdate(
        interview.applicationId,
        { 
          status: 'rejected',
          $push: {
            timeline: {
              status: 'rejected',
              comment: feedback?.detailedNotes || 'Not selected after interview',
              updatedAt: new Date(),
              updatedBy: req.user.id
            }
          }
        }
      );
      
      // Send rejection email (non-blocking)
      (async () => {
        try {
          await sendResultEmail(
            interview.studentId.email,
            interview.studentId.fullName,
            interview.internshipId.title,
            'reject',
            round.roundType
          );
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }
      })();

      // Create rejection notification (non-blocking)
      (async () => {
        try {
          await createNotification({
            recipientId: interview.studentId._id,
            recipientModel: 'Student',
            type: 'interview_result',
            title: 'Application Update',
            message: `Thank you for your interest in ${interview.internshipId.title}. We regret to inform you that you haven't been selected for this position.`,
            data: {
              interviewId: interview._id,
              applicationId: interview.applicationId
            }
          });
        } catch (notifError) {
          console.log('⚠️ Notification failed (non-critical):', notifError.message);
        }
      })();
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

    // Notify recruiter (non-blocking)
    (async () => {
      try {
        await createNotification({
          recipientId: interview.recruiterId,
          recipientModel: 'Recruiter',
          type: 'new_progress_log',
          title: 'Assignment Submitted',
          message: `Student has submitted assignment for Round ${roundNumber}`,
          data: {
            interviewId: interview._id,
            studentId,
            roundNumber
          }
        });
      } catch (notifError) {
        console.log('⚠️ Notification failed (non-critical):', notifError.message);
      }
    })();

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
      .populate('recruiterId', 'fullName email')
      .populate('internshipId', 'title');

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

    // Send email notification (non-blocking)
    (async () => {
      try {
        const recipientEmail = userRole === 'recruiter' 
          ? interview.studentId.email 
          : interview.recruiterId.email;
        
        const recipientName = userRole === 'recruiter'
          ? interview.studentId.fullName
          : interview.recruiterId.fullName;

        await sendInterviewRescheduleEmail(
          recipientEmail,
          recipientName,
          interview.internshipId.title,
          roundNumber,
          newDate,
          newTime,
          reason
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    })();

    // Create notification for other party (non-blocking)
    (async () => {
      try {
        const notificationRecipient = userRole === 'recruiter'
          ? interview.studentId._id
          : interview.recruiterId._id;

        const notificationModel = userRole === 'recruiter' ? 'Student' : 'Recruiter';

        await createNotification({
          recipientId: notificationRecipient,
          recipientModel: notificationModel,
          type: 'interview_rescheduled',
          title: 'Interview Rescheduled',
          message: `Round ${roundNumber} interview has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTime}`,
          data: {
            interviewId: interview._id,
            roundNumber,
            newDate,
            newTime,
            reason
          }
        });
      } catch (notifError) {
        console.log('⚠️ Notification failed (non-critical):', notifError.message);
      }
    })();

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
// 10. RESPOND TO INTERVIEW (Student)
// ============================================
exports.respondToInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { roundNumber, response, reason } = req.body; // response: 'accepted' or 'declined'
    const studentId = req.user.id;

    const interview = await Interview.findById(interviewId)
      .populate('studentId', 'fullName email')
      .populate('recruiterId', 'fullName email')
      .populate('internshipId', 'title');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.studentId._id.toString() !== studentId) {
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

    round.status = response === 'accepted' ? 'scheduled' : 'cancelled';
    if (reason) round.studentFeedback = reason;

    await interview.save();

    // Send email to recruiter (non-blocking)
    (async () => {
      try {
        await sendInterviewResponseEmail(
          interview.recruiterId.email,
          interview.recruiterId.fullName,
          interview.studentId.fullName,
          response,
          reason,
          roundNumber
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    })();

    // Create notification for recruiter (non-blocking)
    (async () => {
      try {
        await createNotification({
          recipientId: interview.recruiterId._id,
          recipientModel: 'Recruiter',
          type: response === 'accepted' ? 'interview_scheduled' : 'interview_cancelled',
          title: `Interview ${response === 'accepted' ? 'Accepted' : 'Declined'}`,
          message: `${interview.studentId.fullName} has ${response} the interview for Round ${roundNumber}`,
          data: {
            interviewId: interview._id,
            roundNumber,
            studentName: interview.studentId.fullName,
            reason
          }
        });
      } catch (notifError) {
        console.log('⚠️ Notification failed (non-critical):', notifError.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: `Interview ${response} successfully`
    });

  } catch (error) {
    console.error('Error responding to interview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 11. GET INTERVIEW STATS FOR RECRUITER
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
        completed: 0,
        cancelled: 0,
        rescheduled: 0
      },
      conversionRate: 0,
      averageRounds: 0
    };

    let totalRounds = 0;

    interviews.forEach(interview => {
      // Overall status
      stats.byStatus[interview.overallStatus]++;

      // Round statuses
      interview.rounds.forEach(round => {
        stats.byRound[round.status]++;
        totalRounds++;
      });
    });

    // Calculate average rounds per interview
    stats.averageRounds = interviews.length > 0 
      ? (totalRounds / interviews.length).toFixed(1)
      : 0;

    // Calculate conversion rate (selected / total completed)
    const totalDecided = stats.byStatus.selected + stats.byStatus.rejected;
    stats.conversionRate = totalDecided > 0 
      ? Math.round((stats.byStatus.selected / totalDecided) * 100)
      : 0;

    // Get monthly trend
    const now = new Date();
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
      
      const monthInterviews = interviews.filter(interview => {
        const createdAt = new Date(interview.createdAt);
        return createdAt.getMonth() === month.getMonth() &&
               createdAt.getFullYear() === month.getFullYear();
      });

      monthlyData.push({
        month: monthStr,
        count: monthInterviews.length,
        selected: monthInterviews.filter(i => i.overallStatus === 'selected').length
      });
    }

    stats.monthlyTrend = monthlyData;

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

// ============================================
// 12. CANCEL INTERVIEW ROUND
// ============================================
exports.cancelRound = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { roundNumber, reason } = req.body;
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

    round.status = 'cancelled';
    if (reason) round.studentFeedback = reason;

    await interview.save();

    // Notify other party (non-blocking)
    (async () => {
      try {
        const notificationRecipient = userRole === 'recruiter'
          ? interview.studentId._id
          : interview.recruiterId._id;

        const notificationModel = userRole === 'recruiter' ? 'Student' : 'Recruiter';

        await createNotification({
          recipientId: notificationRecipient,
          recipientModel: notificationModel,
          type: 'interview_cancelled',
          title: 'Interview Cancelled',
          message: `Round ${roundNumber} interview has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
          data: {
            interviewId: interview._id,
            roundNumber,
            reason
          }
        });
      } catch (notifError) {
        console.log('⚠️ Notification failed (non-critical):', notifError.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: `Round ${roundNumber} cancelled successfully`
    });

  } catch (error) {
    console.error('Error cancelling round:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};