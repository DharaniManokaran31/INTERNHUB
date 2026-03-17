// backend/scripts/createTestApplications.js
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const Recruiter = require('../models/Recruiter');  // ✅ ADD THIS LINE
require('dotenv').config();

const createTestApplications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all students
        const students = await Student.find();
        if (students.length === 0) {
            console.log('❌ No students found. Run createTestStudents.js first.');
            process.exit(1);
        }

        // Get all internships
        const internships = await Internship.find();
        if (internships.length === 0) {
            console.log('❌ No internships found. Run createTestInternships.js first.');
            process.exit(1);
        }

        console.log(`📊 Found ${students.length} students and ${internships.length} internships`);

        // Create a map for easier access
        const studentMap = {};
        students.forEach(s => {
            studentMap[s.email] = s;
        });

        const internshipMap = {};
        internships.forEach(i => {
            internshipMap[i.title] = i;
        });

        // Verify all required internships exist
        const requiredInternships = [
            'Frontend Developer Intern',
            'Backend Developer Intern',
            'DevOps Intern',
            'UI/UX Design Intern',
            'Mobile Developer Intern',
            'Sales Intern'
        ];
        
        for (const title of requiredInternships) {
            if (!internshipMap[title]) {
                console.log(`❌ Missing internship: ${title}`);
                process.exit(1);
            }
        }

        // Clear existing applications
        console.log('\n🧹 Clearing existing applications...');
        await Application.deleteMany({});
        console.log('✅ Cleared all existing applications');

        const now = new Date();
        const applications = [];

        // 1. Rahul Sharma -> Frontend Developer (Pending)
        const rahul = studentMap['rahul.sharma@college.edu'];
        const frontend = internshipMap['Frontend Developer Intern'];
        
        if (rahul && frontend) {
            console.log(`✅ Rahul found: ${rahul._id} -> Frontend (Posted by: Priya Patel)`);
            applications.push({
                studentId: rahul._id,
                internshipId: frontend._id,
                recruiterId: frontend.mentorId,
                status: 'pending',
                coverLetter: "I've been working with React for 2 years and have built several projects including an e-commerce platform. I'm excited to contribute to your team and learn from experienced developers at Zoyaraa.",
                submittedResume: {
                    url: "/uploads/resumes/rahul_resume.pdf",
                    fileName: "Rahul_Sharma_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                timeline: [{
                    status: 'pending',
                    comment: 'Application submitted',
                    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                    updatedBy: rahul._id
                }]
            });
        }

        // 2. Priya Patel -> Frontend Developer (Shortlisted)
        const priya = studentMap['priya.patel@college.edu'];
        
        if (priya && frontend) {
            console.log(`✅ Priya found: ${priya._id} -> Frontend (Posted by: Priya Patel)`);
            applications.push({
                studentId: priya._id,
                internshipId: frontend._id,
                recruiterId: frontend.mentorId,
                status: 'shortlisted',
                coverLetter: "With my experience in Vue.js and strong design sense, I believe I can bring a fresh perspective to your frontend team. I've built analytics dashboards and interactive web applications.",
                submittedResume: {
                    url: "/uploads/resumes/priya_resume.pdf",
                    fileName: "Priya_Patel_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'pending',
                        comment: 'Application submitted',
                        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                        updatedBy: priya._id
                    },
                    {
                        status: 'shortlisted',
                        comment: 'Strong portfolio and relevant skills. Shortlisted for interview.',
                        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                        updatedBy: frontend.mentorId
                    }
                ],
                recruiterNotes: [{
                    note: "Excellent portfolio with multiple React projects. Shortlist for interview.",
                    addedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                    addedBy: frontend.mentorId
                }]
            });
        }

        // 3. Arun Kumar -> Backend Developer (Accepted)
        const arun = studentMap['arun.kumar@college.edu'];
        const backend = internshipMap['Backend Developer Intern'];
        
        if (arun && backend) {
            console.log(`✅ Arun found: ${arun._id} -> Backend (Posted by: Neha Singh)`);
            applications.push({
                studentId: arun._id,
                internshipId: backend._id,
                recruiterId: backend.mentorId,
                status: 'accepted',
                coverLetter: "I have strong experience with Node.js, Express, and MongoDB through my projects. I've built REST APIs and am looking forward to building scalable backend systems.",
                submittedResume: {
                    url: "/uploads/resumes/arun_resume.pdf",
                    fileName: "Arun_Kumar_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'pending',
                        comment: 'Application submitted',
                        updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                        updatedBy: arun._id
                    },
                    {
                        status: 'shortlisted',
                        comment: 'Good technical background. Shortlisted for interview.',
                        updatedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
                        updatedBy: backend.mentorId
                    },
                    {
                        status: 'accepted',
                        comment: 'Excellent interview performance. Selected for the position.',
                        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                        updatedBy: backend.mentorId
                    }
                ],
                recruiterNotes: [
                    {
                        note: "Strong technical skills in Node.js. Schedule interview.",
                        addedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
                        addedBy: backend.mentorId
                    },
                    {
                        note: "Great interview! Solved all coding problems well. Selected for the position.",
                        addedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                        addedBy: backend.mentorId
                    }
                ]
            });
        }

        // 4. Sneha Joshi -> Mobile Developer (Pending)
        const sneha = studentMap['sneha.joshi@college.edu'];
        const mobile = internshipMap['Mobile Developer Intern'];
        
        if (sneha && mobile) {
            console.log(`✅ Sneha found: ${sneha._id} -> Mobile (Posted by: Sneha Joshi)`);
            applications.push({
                studentId: sneha._id,
                internshipId: mobile._id,
                recruiterId: mobile.mentorId,
                status: 'pending',
                coverLetter: "I've built 3 React Native apps and published one to the Play Store. I'm excited to work on production mobile apps and learn from your experienced team.",
                submittedResume: {
                    url: "/uploads/resumes/sneha_resume.pdf",
                    fileName: "Sneha_Joshi_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                timeline: [{
                    status: 'pending',
                    comment: 'Application submitted',
                    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                    updatedBy: sneha._id
                }]
            });
        }

        // 5. Vikram Reddy -> DevOps Intern (Rejected)
        const vikram = studentMap['vikram.reddy@college.edu'];
        const devops = internshipMap['DevOps Intern'];
        
        if (vikram && devops) {
            console.log(`✅ Vikram found: ${vikram._id} -> DevOps (Posted by: Vikram Reddy)`);
            applications.push({
                studentId: vikram._id,
                internshipId: devops._id,
                recruiterId: devops.mentorId,
                status: 'rejected',
                coverLetter: "I have AWS certification and experience with Docker. Looking to grow my DevOps skills and work on cloud infrastructure.",
                submittedResume: {
                    url: "/uploads/resumes/vikram_resume.pdf",
                    fileName: "Vikram_Reddy_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'pending',
                        comment: 'Application submitted',
                        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                        updatedBy: vikram._id
                    },
                    {
                        status: 'rejected',
                        comment: 'Position requires more hands-on experience with Kubernetes and CI/CD',
                        updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
                        updatedBy: devops.mentorId
                    }
                ],
                recruiterNotes: [{
                    note: "Good foundation in AWS but lacks practical Kubernetes experience. Rejected.",
                    addedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
                    addedBy: devops.mentorId
                }]
            });
        }

        // 6. Rahul Sharma -> Backend Developer (Shortlisted)
        if (rahul && backend) {
            console.log(`✅ Rahul found: ${rahul._id} -> Backend (Posted by: Neha Singh)`);
            applications.push({
                studentId: rahul._id,
                internshipId: backend._id,
                recruiterId: backend.mentorId,
                status: 'shortlisted',
                coverLetter: "I've built REST APIs with Node.js and Express for my e-commerce project. Interested in learning more about scalability and system design.",
                submittedResume: {
                    url: "/uploads/resumes/rahul_resume.pdf",
                    fileName: "Rahul_Sharma_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'pending',
                        comment: 'Application submitted',
                        updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
                        updatedBy: rahul._id
                    },
                    {
                        status: 'shortlisted',
                        comment: 'Good experience with Node.js. Shortlisted for interview.',
                        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                        updatedBy: backend.mentorId
                    }
                ],
                recruiterNotes: [{
                    note: "Solid Node.js skills. Shortlist for interview.",
                    addedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                    addedBy: backend.mentorId
                }]
            });
        }

        // 7. Priya Patel -> UI/UX Design (Pending)
        const ux = internshipMap['UI/UX Design Intern'];
        
        if (priya && ux) {
            console.log(`✅ Priya found: ${priya._id} -> UI/UX (Posted by: Ankit Desai)`);
            applications.push({
                studentId: priya._id,
                internshipId: ux._id,
                recruiterId: ux.mentorId,
                status: 'pending',
                coverLetter: "I have a strong design portfolio with experience in Figma and user research. I'd love to work on your products and create intuitive user experiences.",
                submittedResume: {
                    url: "/uploads/resumes/priya_resume.pdf",
                    fileName: "Priya_Patel_Resume.pdf",
                    uploadedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
                },
                appliedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                timeline: [{
                    status: 'pending',
                    comment: 'Application submitted',
                    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                    updatedBy: priya._id
                }]
            });
        }

        console.log(`\n📝 Creating ${applications.length} applications...`);

        if (applications.length === 0) {
            console.log('❌ No applications to create!');
            process.exit(1);
        }

        // Insert all applications
        const result = await Application.insertMany(applications);
        console.log(`\n✅ ${result.length} test applications created successfully!`);

        // Update internship application counts
        console.log('\n📊 Updating internship application counts...');
        for (const internship of internships) {
            const count = await Application.countDocuments({ internshipId: internship._id });
            internship.applicationCount = count;
            await internship.save();
            
            // Get recruiter name
            const recruiter = await Recruiter.findById(internship.mentorId);
            const recruiterName = recruiter ? recruiter.fullName : 'Unknown';
            
            console.log(`   • ${internship.title} (Posted by: ${recruiterName}): ${count} applications`);
        }

        // Calculate stats
        const allApps = await Application.find();
        const pending = allApps.filter(a => a.status === 'pending').length;
        const shortlisted = allApps.filter(a => a.status === 'shortlisted').length;
        const accepted = allApps.filter(a => a.status === 'accepted').length;
        const rejected = allApps.filter(a => a.status === 'rejected').length;

        console.log('\n📊 APPLICATION STATS:');
        console.log(`   🟡 Pending: ${pending}`);
        console.log(`   🔵 Shortlisted: ${shortlisted}`);
        console.log(`   🟢 Accepted: ${accepted}`);
        console.log(`   🔴 Rejected: ${rejected}`);
        console.log(`   📊 Total: ${allApps.length}`);

        console.log('\n📋 APPLICATIONS BY RECRUITER:');
        const apps = await Application.find()
            .populate('internshipId')
            .populate('studentId', 'fullName');
        
        const byRecruiter = {};
        for (const app of apps) {
            const recruiter = await Recruiter.findById(app.recruiterId);
            const recruiterName = recruiter ? recruiter.fullName : 'Unknown';
            
            if (!byRecruiter[recruiterName]) {
                byRecruiter[recruiterName] = [];
            }
            byRecruiter[recruiterName].push({
                student: app.studentId?.fullName,
                status: app.status,
                internship: app.internshipId?.title
            });
        }

        Object.entries(byRecruiter).forEach(([recruiter, apps]) => {
            console.log(`\n   ${recruiter}:`);
            apps.forEach(app => {
                console.log(`      • ${app.student} - ${app.internship} (${app.status})`);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
        process.exit(0);
    }
};

createTestApplications();