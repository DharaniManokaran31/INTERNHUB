const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const DailyLog = require('../models/DailyLog');
const Application = require('../models/Application');

const studentId = '69ba1d9af0d352e966a5894d';
const internshipId = '69b91546ad4d7bca3eabadb8';
const mentorId = '69b105ca8f62a8d2301ef5c0';

const startDate = new Date('2026-05-01');
const endDate = new Date('2026-07-30');

const frontendTasks = [
  { description: 'Introduction to codebase and architecture', learning: 'Codebase structure, project naming conventions', challenge: 'Understanding folder hierarchy' },
  { description: 'Implementing responsive navigation bar using CSS Grid', learning: 'CSS Grid, Media Queries', challenge: 'Ensuring mobile accessibility' },
  { description: 'Creating reusable form components with validation', learning: 'Controlled components in React, Regex', challenge: 'Complex validation logic' },
  { description: 'Integrating REST API for user profile section', learning: 'Axios, Async/Await, Error handling', challenge: 'Managing loading states' },
  { description: 'Setting up Redux store for global state management', learning: 'Redux Toolkit, Slices, Selectors', challenge: 'Prop drilling issues vs local state' },
  { description: 'Optimizing image loading with lazy loading', learning: 'Performance optimization, Intersection Observer', challenge: 'Handling placeholder images' },
  { description: 'Writing unit tests for utility functions', learning: 'Jest, React Testing Library', challenge: 'Writing meaningful test cases' },
  { description: 'Refactoring class components to Functional with Hooks', learning: 'useState, useEffect, custom Hooks', challenge: 'Converting lifecycle methods correctly' },
  { description: 'Implementing dark mode support with CSS Variables', learning: 'Theme Management, LocalStorage', challenge: 'Transition animations' },
  { description: 'Fixing console warnings and performance bottlenecks', learning: 'Chrome DevTools, React Profiler', challenge: 'Analyzing re-renders' },
  { description: 'Building a dynamic dashboard widget for analytics', learning: 'Chart.js, D3 integration basics', challenge: 'Data visualization logic' },
  { description: 'Adding drag-and-drop functionality for file uploads', learning: 'HTML5 Drag and Drop API', challenge: 'Cross-browser compatibility' },
  { description: 'Migrating codebase to TypeScript for type safety', learning: 'TypeScript Interfaces, Generics', challenge: 'Dealing with complex types' },
  { description: 'Implementing authentication flow with JWT tokens', learning: 'Security best practices, HTTP-only cookies', challenge: 'Session persistence logic' },
  { description: 'Conducting final code audit and documentation', learning: 'Markdown, README best practices', challenge: 'Summarizing 3 months of work' }
];

async function seedLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/internhub');
    console.log('✅ Connected to MongoDB for seeding daily logs');

    // Remove existing logs for this combination to start fresh
    await DailyLog.deleteMany({ studentId, internshipId });
    console.log('🧹 Cleaned up existing logs');

    const logs = [];
    let currentDate = new Date(startDate);
    let dayNum = 1;

    console.log('⏳ Generating logs from May to July...');

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0: Sunday, 6: Saturday
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Real-world tasks
        const taskInfo = frontendTasks[dayNum % frontendTasks.length];
        
        const logsCount = Math.floor(Math.random() * 2) + 1; // 1-2 tasks per day
        const tasks = [];
        let runningTotal = 0;
        
        for (let i = 0; i < logsCount; i++) {
          const h = (i === 0 ? (4 + Math.random() * 2) : (2 + Math.random() * 2));
          const roundedH = parseFloat(h.toFixed(1));
          
          tasks.push({
            description: i === 0 ? taskInfo.description : `Debugging previous tasks and refactoring components`,
            hoursSpent: roundedH,
            status: 'completed',
            githubLink: 'https://github.com/zoyaraa'
          });
          runningTotal += roundedH;
        }

        const log = new DailyLog({
          studentId,
          internshipId,
          mentorId,
          date: new Date(currentDate),
          dayNumber: dayNum,
          tasksCompleted: tasks,
          totalHours: parseFloat(runningTotal.toFixed(1)), // Ensure it matches exactly
          learnings: taskInfo.learning + '. Also practiced clean code principles.',
          challenges: taskInfo.challenge + '. Managed to resolve by researching docs.',
          tomorrowPlan: 'Continue feature development and attend daily standup.',
          mood: ['😊 Great', '🙂 Good', '😐 Okay'][Math.floor(Math.random() * 3)],
          status: 'approved',
          submittedAt: new Date(currentDate.getTime() + (18 * 60 * 60 * 1000)),
          reviewedAt: new Date(currentDate.getTime() + (20 * 60 * 60 * 1000)),
          mentorFeedback: {
            comment: 'Consistently good progress. Your attention to detail is improving.',
            rating: Math.floor(Math.random() * 2) + 4,
            submittedAt: new Date(currentDate.getTime() + (21 * 60 * 60 * 1000)),
            reviewedBy: mentorId
          }
        });

        logs.push(log);
        dayNum++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    try {
        await DailyLog.insertMany(logs);
        console.log(`🚀 Successfully seeded ${logs.length} daily logs for Siva Lavanya S`);
    } catch (insertError) {
        if (insertError.name === 'ValidationError') {
            Object.keys(insertError.errors).forEach(key => {
                console.error(`❌ Validation Error in field "${key}":`, insertError.errors[key].message);
            });
        }
        console.error('❌ InsertMany error:', insertError.message);
        process.exit(1);
    }

    // Update application status to completed if not already
    const application = await Application.findOne({ studentId, internshipId });
    if (application) {
       application.status = 'completed';
       
       const hasCompletedEntry = application.timeline.some(t => t.status === 'completed');
       if (!hasCompletedEntry) {
           application.timeline.push({
               status: 'completed',
               comment: 'Internship completed successfully! All daily logs have been reviewed and approved.',
               updatedAt: new Date(),
               updatedBy: mentorId // Added missing required field
           });
       } else {
          // Update the existing completed entry's date and comment
          const entry = application.timeline.find(t => t.status === 'completed');
          entry.updatedAt = new Date();
          entry.comment = 'Internship logs verified for certificate issuance.';
          entry.updatedBy = mentorId;
       }
       await application.save();
       console.log('🎓 Application status updated to completed');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedLogs();
