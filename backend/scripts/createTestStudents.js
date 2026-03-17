// backend/scripts/createTestStudents.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
require('dotenv').config();

const createTestStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const password = await bcrypt.hash('Student@123', 10);
        const now = new Date();

        const testStudents = [
            {
                fullName: "Rahul Sharma",
                email: "rahul.sharma@college.edu",
                password: password,
                phone: "9876543210",
                role: 'student',
                currentEducation: {
                    college: "IIT Bombay",
                    department: "Computer Science",
                    yearOfStudy: "3rd Year",
                    course: "B.Tech",
                    specialization: "Software Engineering"
                },
                skills: ["JavaScript", "React", "Node.js", "MongoDB"],
                location: "Mumbai",
                linkedin: "",
                github: "",
                isActive: true,
                isEmailVerified: true,
                resume: {
                    education: [
                        {
                            institution: "IIT Bombay",
                            degree: "B.Tech",
                            field: "Computer Science",
                            startDate: new Date("2022-07-01"),
                            endDate: new Date("2026-05-30"),
                            gpa: 8.7
                        }
                    ],
                    projects: [
                        {
                            title: "E-commerce Platform",
                            description: "Built a full-stack e-commerce platform using MERN stack",
                            technologies: "React, Node.js, MongoDB, Express"
                        }
                    ],
                    skills: [
                        {
                            category: "Programming Languages", // ✅ Valid category
                            items: ["JavaScript", "Python", "Java"]
                        },
                        {
                            category: "Frameworks", // ✅ Valid category
                            items: ["React", "Node.js", "Express"]
                        }
                    ],
                    certifications: []
                }
            },
            {
                fullName: "Priya Patel",
                email: "priya.patel@college.edu",
                password: password,
                phone: "9876543211",
                role: 'student',
                currentEducation: {
                    college: "IIT Delhi",
                    department: "Information Technology",
                    yearOfStudy: "4th Year",
                    course: "B.Tech",
                    specialization: "Web Development"
                },
                skills: ["JavaScript", "Vue.js", "Python", "Django"],
                location: "Delhi",
                linkedin: "",
                github: "",
                isActive: true,
                isEmailVerified: true,
                resume: {
                    education: [
                        {
                            institution: "IIT Delhi",
                            degree: "B.Tech",
                            field: "Information Technology",
                            startDate: new Date("2021-07-01"),
                            endDate: new Date("2025-05-30"),
                            gpa: 8.9
                        }
                    ],
                    projects: [
                        {
                            title: "Social Media Dashboard",
                            description: "Analytics dashboard for social media metrics",
                            technologies: "Vue.js, D3.js, Django"
                        }
                    ],
                    skills: [
                        {
                            category: "Programming Languages", // ✅ Valid category
                            items: ["JavaScript", "Python", "TypeScript"]
                        },
                        {
                            category: "Frameworks", // ✅ Valid category
                            items: ["Vue.js", "Django", "Flask"]
                        }
                    ],
                    certifications: []
                }
            },
            {
                fullName: "Arun Kumar",
                email: "arun.kumar@college.edu",
                password: password,
                phone: "9876543212",
                role: 'student',
                currentEducation: {
                    college: "BITS Pilani",
                    department: "Computer Science",
                    yearOfStudy: "3rd Year",
                    course: "B.E.",
                    specialization: "Full Stack Development"
                },
                skills: ["JavaScript", "Angular", "Java", "Spring Boot"],
                location: "Pilani",
                linkedin: "",
                github: "",
                isActive: true,
                isEmailVerified: true,
                resume: {
                    education: [
                        {
                            institution: "BITS Pilani",
                            degree: "B.E.",
                            field: "Computer Science",
                            startDate: new Date("2022-08-01"),
                            endDate: new Date("2026-05-30"),
                            gpa: 8.5
                        }
                    ],
                    projects: [
                        {
                            title: "Task Management App",
                            description: "Collaborative task management tool",
                            technologies: "Angular, Spring Boot, MySQL"
                        }
                    ],
                    skills: [
                        {
                            category: "Programming Languages", // ✅ Valid category
                            items: ["JavaScript", "Java", "SQL"]
                        },
                        {
                            category: "Frameworks", // ✅ Valid category
                            items: ["Angular", "Spring Boot", "Hibernate"]
                        }
                    ],
                    certifications: []
                }
            },
            {
                fullName: "Sneha Joshi",
                email: "sneha.joshi@college.edu",
                password: password,
                phone: "9876543213",
                role: 'student',
                currentEducation: {
                    college: "VIT Vellore",
                    department: "Computer Science",
                    yearOfStudy: "4th Year",
                    course: "B.Tech",
                    specialization: "Mobile Development"
                },
                skills: ["JavaScript", "React Native", "Flutter", "Firebase"],
                location: "Vellore",
                linkedin: "",
                github: "",
                isActive: true,
                isEmailVerified: true,
                resume: {
                    education: [
                        {
                            institution: "VIT Vellore",
                            degree: "B.Tech",
                            field: "Computer Science",
                            startDate: new Date("2021-07-01"),
                            endDate: new Date("2025-05-30"),
                            gpa: 9.1
                        }
                    ],
                    projects: [
                        {
                            title: "Fitness Tracker App",
                            description: "Mobile app for tracking workouts and nutrition",
                            technologies: "React Native, Firebase"
                        }
                    ],
                    skills: [
                        {
                            category: "Programming Languages", // ✅ Valid category
                            items: ["JavaScript", "Dart", "Swift"]
                        },
                        {
                            category: "Frameworks", // ✅ Valid category
                            items: ["React Native", "Flutter"]
                        }
                    ],
                    certifications: []
                }
            },
            {
                fullName: "Vikram Reddy",
                email: "vikram.reddy@college.edu",
                password: password,
                phone: "9876543214",
                role: 'student',
                currentEducation: {
                    college: "IIIT Hyderabad",
                    department: "Computer Science",
                    yearOfStudy: "3rd Year",
                    course: "B.Tech",
                    specialization: "DevOps"
                },
                skills: ["Python", "AWS", "Docker", "Kubernetes"],
                location: "Hyderabad",
                linkedin: "",
                github: "",
                isActive: true,
                isEmailVerified: true,
                resume: {
                    education: [
                        {
                            institution: "IIIT Hyderabad",
                            degree: "B.Tech",
                            field: "Computer Science",
                            startDate: new Date("2022-07-01"),
                            endDate: new Date("2026-05-30"),
                            gpa: 8.8
                        }
                    ],
                    projects: [
                        {
                            title: "CI/CD Pipeline Automation",
                            description: "Automated deployment pipeline using Jenkins",
                            technologies: "Jenkins, Docker, AWS"
                        }
                    ],
                    skills: [
                        {
                            category: "Tools", // ✅ Valid category (instead of Cloud Platforms)
                            items: ["Docker", "Kubernetes", "Jenkins"]
                        },
                        {
                            category: "Programming Languages", // ✅ Valid category
                            items: ["Python"]
                        }
                    ],
                    certifications: []
                }
            }
        ];

        console.log('🧹 Clearing existing students...');
        await Student.deleteMany({});
        
        const result = await Student.insertMany(testStudents);
        console.log(`\n✅ ${result.length} test students created successfully!`);
        console.log('\n📋 STUDENTS:');
        result.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.fullName} (${student.email}) - ${student.currentEducation.college}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        if (error.errors) {
            console.error('\n📋 Validation Errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`   ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
        process.exit(0);
    }
};

createTestStudents();