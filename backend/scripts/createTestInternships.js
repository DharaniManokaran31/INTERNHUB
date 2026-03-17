// backend/scripts/createTestInternships.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // ✅ ADD THIS LINE
const Internship = require('../models/Internship');
const Recruiter = require('../models/Recruiter');
const Company = require('../models/Company');
require('dotenv').config();

const createTestInternships = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get company
        const company = await Company.findOne();
        if (!company) {
            console.log('❌ No company found');
            process.exit(1);
        }
        console.log(`✅ Company: ${company.name}`);

        // Get ALL recruiters by department
        const recruiters = await Recruiter.find({ 
            role: 'recruiter', 
            isActive: true,
            invitationStatus: 'accepted'
        });

        if (recruiters.length === 0) {
            console.log('❌ No active recruiters found');
            process.exit(1);
        }

        // Create a map of recruiters by department
        const recruiterByDept = {};
        recruiters.forEach(r => {
            recruiterByDept[r.department] = r;
        });

        console.log('\n📋 RECRUITERS BY DEPARTMENT:');
        Object.entries(recruiterByDept).forEach(([dept, rec]) => {
            console.log(`   ${dept}: ${rec.fullName} (${rec.email})`);
        });

        // Check for missing departments
        const requiredDepartments = ['Frontend', 'Backend', 'DevOps', 'Mobile', 'UI/UX', 'Sales', 'Marketing'];
        const missingDepts = requiredDepartments.filter(dept => !recruiterByDept[dept]);
        
        if (missingDepts.length > 0) {
            console.log(`\n⚠️ Warning: Missing recruiters for departments: ${missingDepts.join(', ')}`);
            console.log('Creating default recruiters for missing departments...');
            
            // Create default recruiters for missing departments
            const defaultPassword = await bcrypt.hash('Dharu@2005', 10);
            
            for (const dept of missingDepts) {
                const defaultRecruiter = new Recruiter({
                    fullName: `${dept} Recruiter`,
                    email: `dharani31082005+${dept.toLowerCase()}@gmail.com`,
                    password: defaultPassword,
                    role: 'recruiter',
                    companyId: company._id,
                    company: company.name,
                    department: dept,
                    designation: `${dept} Recruiter`,
                    isInvited: true,
                    invitationStatus: 'accepted',
                    isActive: true,
                    permissions: {
                        canPostInternship: true,
                        canViewApplicants: true,
                        canShortlist: true,
                        canAcceptReject: true,
                        canMentor: true,
                        maxInterns: 3,
                        departmentOnly: true
                    }
                });
                
                await defaultRecruiter.save();
                recruiterByDept[dept] = defaultRecruiter;
                console.log(`   ✅ Created default recruiter for ${dept}`);
            }
        }

        const now = new Date();
        const testInternships = [];

        // Helper to safely get recruiter ID
        const getRecruiterId = (dept) => {
            const recruiter = recruiterByDept[dept];
            if (!recruiter) {
                throw new Error(`No recruiter found for department: ${dept}`);
            }
            return recruiter._id;
        };

        // Frontend Internship
        if (recruiterByDept['Frontend']) {
            testInternships.push({
                title: "Frontend Developer Intern",
                description: "Looking for a passionate frontend developer intern to join our team and work on exciting projects using React and modern web technologies.",
                type: "On-site",
                companyName: company.name,
                companyId: company._id,
                location: "Bangalore",
                department: "Frontend",
                mentorId: recruiterByDept['Frontend']._id,
                workMode: "Hybrid",
                officeLocation: "Manyata Tech Park, Bangalore",
                dailyTimings: "10 AM - 6 PM",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 104 * 24 * 60 * 60 * 1000),
                duration: 3,
                totalDays: 90,
                completedDays: 0,
                stipend: 15000,
                positions: 2,
                filledPositions: 0,
                skillsRequired: [
                    { name: "React", level: "intermediate" },
                    { name: "JavaScript", level: "intermediate" },
                    { name: "CSS", level: "beginner" }
                ],
                requirements: [
                    "Currently pursuing B.Tech/B.E. in CS/IT",
                    "Knowledge of React basics"
                ],
                perks: [
                    "Flexible working hours",
                    "Certificate upon completion"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "Technical Test",
                        duration: "60 mins",
                        details: "Online coding assessment covering React, JavaScript, and problem solving"
                    },
                    {
                        round: 2,
                        type: "Technical Interview",
                        duration: "45 mins",
                        details: "Live coding interview with the frontend team"
                    },
                    {
                        round: 3,
                        type: "HR Interview",
                        duration: "30 mins",
                        details: "Culture fit and behavioral discussion"
                    }
                ],
                status: "active",
                postedBy: recruiterByDept['Frontend']._id,
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                category: "technology"
            });
        }

        // Backend Internship
        if (recruiterByDept['Backend']) {
            testInternships.push({
                title: "Backend Developer Intern",
                description: "Join our backend team to build scalable APIs and microservices using Node.js and MongoDB.",
                type: "Remote",
                companyName: company.name,
                companyId: company._id,
                location: "Remote",
                department: "Backend",
                mentorId: recruiterByDept['Backend']._id,
                workMode: "Remote",
                dailyTimings: "Flexible",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 194 * 24 * 60 * 60 * 1000),
                duration: 6,
                totalDays: 180,
                completedDays: 0,
                stipend: 20000,
                positions: 3,
                filledPositions: 0,
                skillsRequired: [
                    { name: "Node.js", level: "intermediate" },
                    { name: "Express", level: "intermediate" },
                    { name: "MongoDB", level: "beginner" }
                ],
                requirements: [
                    "Experience with Node.js",
                    "Understanding of REST APIs"
                ],
                perks: [
                    "Remote work",
                    "Letter of recommendation"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "Technical Test",
                        duration: "90 mins",
                        details: "API design and database query challenges"
                    },
                    {
                        round: 2,
                        type: "Technical Interview",
                        duration: "60 mins",
                        details: "System design and coding interview"
                    }
                ],
                status: "active",
                postedBy: recruiterByDept['Backend']._id,
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                category: "technology"
            });
        }

        // DevOps Internship
        if (recruiterByDept['DevOps']) {
            testInternships.push({
                title: "DevOps Intern",
                description: "Learn DevOps practices while working on AWS, Docker, and CI/CD pipelines.",
                type: "On-site",
                companyName: company.name,
                companyId: company._id,
                location: "Bangalore",
                department: "DevOps",
                mentorId: recruiterByDept['DevOps']._id,
                workMode: "Onsite",
                officeLocation: "Electronic City, Bangalore",
                dailyTimings: "9 AM - 5 PM",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 111 * 24 * 60 * 60 * 1000),
                duration: 3,
                totalDays: 90,
                completedDays: 0,
                stipend: 18000,
                positions: 1,
                filledPositions: 0,
                skillsRequired: [
                    { name: "AWS", level: "beginner" },
                    { name: "Docker", level: "beginner" },
                    { name: "Linux", level: "beginner" }
                ],
                requirements: [
                    "Basic understanding of cloud concepts",
                    "Linux command line knowledge"
                ],
                perks: [
                    "Hands-on experience with AWS",
                    "DevOps certification guidance"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "Technical Interview",
                        duration: "45 mins",
                        details: "Basic DevOps concepts and Linux commands"
                    }
                ],
                status: "draft",
                postedBy: recruiterByDept['DevOps']._id,
                deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                category: "technology"
            });
        }

        // UI/UX Internship
        if (recruiterByDept['UI/UX']) {
            testInternships.push({
                title: "UI/UX Design Intern",
                description: "Design beautiful and intuitive user interfaces for our products using Figma.",
                type: "Remote",
                companyName: company.name,
                companyId: company._id,
                location: "Remote",
                department: "UI/UX",
                mentorId: recruiterByDept['UI/UX']._id,
                workMode: "Remote",
                dailyTimings: "Flexible",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 104 * 24 * 60 * 60 * 1000),
                duration: 3,
                totalDays: 90,
                completedDays: 0,
                stipend: 12000,
                positions: 2,
                filledPositions: 0,
                skillsRequired: [
                    { name: "Figma", level: "intermediate" },
                    { name: "UI Design", level: "intermediate" },
                    { name: "Wireframing", level: "beginner" }
                ],
                requirements: [
                    "Portfolio of design work",
                    "Knowledge of design principles"
                ],
                perks: [
                    "Work on real products",
                    "Mentorship from senior designers"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "Assignment",
                        duration: "3 days",
                        details: "Design a mobile app screen in Figma"
                    },
                    {
                        round: 2,
                        type: "Technical Interview",
                        duration: "45 mins",
                        details: "Discuss your design process and past work"
                    }
                ],
                status: "draft",
                postedBy: recruiterByDept['UI/UX']._id,
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                category: "design"
            });
        }

        // Mobile Internship
        if (recruiterByDept['Mobile']) {
            testInternships.push({
                title: "Mobile Developer Intern",
                description: "Build cross-platform mobile apps using React Native.",
                type: "Hybrid",
                companyName: company.name,
                companyId: company._id,
                location: "Hybrid",
                department: "Mobile",
                mentorId: recruiterByDept['Mobile']._id,
                workMode: "Hybrid",
                officeLocation: "Whitefield, Bangalore",
                dailyTimings: "10 AM - 6 PM",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 104 * 24 * 60 * 60 * 1000),
                duration: 3,
                totalDays: 90,
                completedDays: 0,
                stipend: 18000,
                positions: 2,
                filledPositions: 0,
                skillsRequired: [
                    { name: "React Native", level: "intermediate" },
                    { name: "JavaScript", level: "intermediate" },
                    { name: "Mobile UI", level: "beginner" }
                ],
                requirements: [
                    "Experience with React",
                    "Interest in mobile development"
                ],
                perks: [
                    "Work on production apps",
                    "App store deployment experience"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "Technical Test",
                        duration: "60 mins",
                        details: "React Native coding challenge"
                    },
                    {
                        round: 2,
                        type: "Technical Interview",
                        duration: "45 mins",
                        details: "Discussion on mobile architecture"
                    }
                ],
                status: "active",
                postedBy: recruiterByDept['Mobile']._id,
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                category: "technology"
            });
        }

        // Sales Internship
        if (recruiterByDept['Sales']) {
            testInternships.push({
                title: "Sales Intern",
                description: "Learn sales strategies and work with our sales team.",
                type: "Remote",
                companyName: company.name,
                companyId: company._id,
                location: "Remote",
                department: "Sales",
                mentorId: recruiterByDept['Sales']._id,
                workMode: "Remote",
                dailyTimings: "Flexible",
                weeklyOff: "Saturday, Sunday",
                startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
                endDate: new Date(now.getTime() + 111 * 24 * 60 * 60 * 1000),
                duration: 3,
                totalDays: 90,
                completedDays: 0,
                stipend: 10000,
                positions: 2,
                filledPositions: 0,
                skillsRequired: [
                    { name: "Communication", level: "intermediate" },
                    { name: "Negotiation", level: "beginner" }
                ],
                requirements: [
                    "Good communication skills",
                    "Interest in sales"
                ],
                perks: [
                    "Commission on sales",
                    "Certificate upon completion"
                ],
                selectionProcess: [
                    {
                        round: 1,
                        type: "HR Interview",
                        duration: "30 mins",
                        details: "Initial screening and communication check"
                    },
                    {
                        round: 2,
                        type: "Technical Interview",
                        duration: "30 mins",
                        details: "Sales pitch and scenario discussion"
                    }
                ],
                status: "active",
                postedBy: recruiterByDept['Sales']._id,
                deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                category: "sales"
            });
        }

        if (testInternships.length === 0) {
            console.log('❌ No internships could be created - missing recruiters');
            process.exit(1);
        }

        // Clear existing internships
        console.log('\n🧹 Clearing existing internships...');
        await Internship.deleteMany({});
        console.log('✅ Cleared existing internships');

        const result = await Internship.insertMany(testInternships);
        console.log(`\n✅ ${result.length} test internships created successfully!`);
        console.log('\n📊 INTERNSHIPS BY RECRUITER:');
        
        // Group by postedBy
        const byRecruiter = {};
        result.forEach(internship => {
            const recruiter = Object.values(recruiterByDept).find(r => r._id.equals(internship.postedBy));
            const name = recruiter ? recruiter.fullName : 'Unknown';
            if (!byRecruiter[name]) byRecruiter[name] = [];
            byRecruiter[name].push(internship.title);
        });

        Object.entries(byRecruiter).forEach(([recruiter, internships]) => {
            console.log(`\n   ${recruiter}:`);
            internships.forEach(title => console.log(`      • ${title}`));
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
        process.exit(0);
    }
};

createTestInternships();