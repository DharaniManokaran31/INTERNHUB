const fs = require('fs');

const studentId = "69abbbda0d41338e7db3d8de";
const internshipId = "69abea9810648a09d56cefdc";
const mentorId = "69aba0f175d477ffa16bce3b";

const startDate = new Date('2026-06-01T10:00:00Z');
const endDate = new Date('2026-08-31T18:00:00Z');

const topicsByWeek = {
    1: { topic: "React Core Concepts", tasks: ["Set up local dev environment", "Learn JSX syntax and rules", "Build simple nested components", "Study React component lifecycle", "Practice passing props and state"] },
    2: { topic: "Hooks Deep Dive", tasks: ["Implement useState for counter app", "Use useEffect for API data fetching", "Learn useContext for theme switching", "Create custom useFetch hook", "Handle complex form interactions"] },
    3: { topic: "React Router & Navigation", tasks: ["Setup React Router v6", "Create layout components", "Implement nested routing", "Add protected routes", "Handle 404 pages and redirects"] },
    4: { topic: "API Integration", tasks: ["Fetch data using Axios", "Handle loading and error states", "Implement async/await patterns", "Send POST/PUT requests to mock API", "Create data service layer"] },
    5: { topic: "State Management", tasks: ["Deep dive into Context API", "Refactor prop drilling to Context", "Implement useReducer for complex state", "State architecture planning", "Compare Context vs Redux concepts"] },
    6: { topic: "Redux Toolkit", tasks: ["Setup Redux Toolkit store", "Create slices and reducers", "Dispatch basic actions", "Implement async actions with createAsyncThunk", "Use RTK Query for data fetching"] },
    7: { topic: "Performance Optimization", tasks: ["Analyze render performance", "Implement React.memo for list items", "Use useMemo for expensive calculations", "Use useCallback for event handlers", "Implement code splitting with React.lazy"] },
    8: { topic: "Styling & UI Libraries", tasks: ["Master Tailwind CSS utilities", "Build responsive layouts with Tailwind", "Integrate Material UI components", "Customize MUI theme", "Implement dark mode"] },
    9: { topic: "Testing Fundamentals", tasks: ["Setup Jest testing environment", "Write unit tests for utility functions", "Use React Testing Library for components", "Test component user interactions", "Mock API calls in tests"] },
    10: { topic: "Project Setup & Planning", tasks: ["Gather E-commerce requirements", "Plan application architecture", "Create wireframes and mockups", "Setup project repository and Git workflow", "Initialize project technical stack"] },
    11: { topic: "Core Features", tasks: ["Implement authentication flow", "Build product listing page", "Create product detail views", "Implement shopping cart logic", "Build user profile section"] },
    12: { topic: "Advanced Features", tasks: ["Implement order management", "Build admin dashboard", "Integrate charts for analytics", "Implement real-time updates for notifications", "Add search and filtering features"] },
    13: { topic: "Polish & Deployment", tasks: ["Conduct comprehensive testing", "Fix UI bugs and inconsistencies", "Optimize application bundle size", "Deploy app to Vercel/Netlify", "Write project documentation"] },
    14: { topic: "Final Presentations", tasks: ["Prepare final presentation deck", "Conduct final code review", "Practice project demo", "Refine project documentation", "Handover completed project"] }
};

const specialDays = {
    1: { tasks: ["Setup work machine and accounts", "Orientation and platform walkthrough", "Initial meeting with mentor Nandhini"], challenges: "Setting up all access permissions took some time.", learnings: "Understanding Zoyara's team structure and work culture.", feedback: "Great start Lavanya! Make sure to go through the frontend guidelines doc by tomorrow.", rating: 3 },
    30: { tasks: ["Mid-internship review preparation", "Self-assessment documentation", "Review meeting with mentor"], challenges: "Self-evaluating technical progress accurately.", learnings: "Identified key areas to focus on for the next half.", feedback: "You've shown good progress in React basics. Let's focus more on state management moving forward.", rating: 4 },
    45: { tasks: ["Project Kickoff: E-commerce Dashboard", "Requirement analysis session", "Architecture planning"], challenges: "Planning state structure for the entire application.", learnings: "How to break down a large project into deliverable sprints.", feedback: "Solid architecture plan. Remember to keep components modular.", rating: 4 },
    60: { tasks: ["Progress review milestone", "Demonstration of core features", "Code quality check"], challenges: "Integrating real-time features with existing state.", learnings: "Advanced Redux patterns for real-time data.", feedback: "Excellent progress on the project. The code quality has improved significantly.", rating: 5 },
    66: { tasks: ["Final project presentation", "Final code review and handover", "Exit interview"], challenges: "Condensing 3 months of work into a 15-minute presentation.", learnings: "End-to-end product development lifecycle.", feedback: "Outstanding work throughout the internship, Lavanya. You've grown tremendously as a developer. Wishing you the best!", rating: 5 }
};

let currentDate = new Date(startDate);
let dayNumber = 1;
let logs = [];

// Helper to format date
const formatDate = (date) => date.toISOString().split('T')[0];

while (currentDate <= endDate && dayNumber <= 66) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        const weekNumber = Math.floor((dayNumber - 1) / 5) + 1;
        const weekData = topicsByWeek[weekNumber] || topicsByWeek[14];

        // Select 1-2 random tasks from the week's topics
        const taskIndex = (dayNumber - 1) % weekData.tasks.length;
        const taskDescription = weekData.tasks[taskIndex];

        // Generate hours
        const baseHours = Math.floor(Math.random() * 3) + 5; // 5-7 hours
        const decimal = Math.random() > 0.5 ? 0.5 : 0;
        const totalHours = baseHours + decimal;

        const dateStr = formatDate(currentDate);
        const isFriday = dayOfWeek === 5;

        let status = "approved";
        let mentorFeedback = `Good work on ${weekData.topic.toLowerCase()}. Keep it up!`;
        let rating = weekNumber < 5 ? 3 : (weekNumber < 10 ? 4 : 5);

        // Inject some rejected/needs_revision logs randomly, but ensure they aren't on special days
        if ([15, 27, 42].includes(dayNumber)) {
            status = "needs_revision";
            mentorFeedback = "Please review the code standard guidelines. Your components are too monolithic. Break them down and resubmit.";
            rating = 2; // Temporary low rating for revision
        } else if ([16, 28, 43].includes(dayNumber)) {
            status = "approved";
            mentorFeedback = "Much better! Thanks for making those revisions. Component structure looks solid now.";
            rating = 4;
        } else if (isFriday) {
            mentorFeedback = `Solid progress this week on ${weekData.topic}. Have a great weekend!`;
        }

        let logEntry = {
            studentId,
            internshipId,
            mentorId,
            date: dateStr,
            dayNumber,
            weekNumber,
            tasksCompleted: [
                {
                    description: taskDescription,
                    hoursSpent: totalHours - 1,
                    status: "completed",
                    githubLink: `https://github.com/lavanya-s/zoyara-internship/tree/main/day-${dayNumber}`
                },
                {
                    description: "Documentation and code review",
                    hoursSpent: 1,
                    status: "completed"
                }
            ],
            totalHours,
            learnings: `Learned about practical implementations of ${weekData.topic}.`,
            challenges: `Faced some minor bugs initially, resolved them using documentation.`,
            tomorrowPlan: "Continue with the planned curriculum and improve code quality.",
            status,
            mentorFeedback: {
                comment: mentorFeedback,
                rating: rating,
                submittedAt: `${dateStr}T18:30:00Z`
            },
            submittedAt: `${dateStr}T17:00:00Z`,
            reviewedAt: status === "approved" || status === "needs_revision" ? `${dateStr}T18:30:00Z` : null
        };

        // Override with special days if necessary
        if (specialDays[dayNumber]) {
            const special = specialDays[dayNumber];
            logEntry.tasksCompleted[0].description = special.tasks.join(", ");
            logEntry.challenges = special.challenges;
            logEntry.learnings = special.learnings;
            logEntry.mentorFeedback.comment = special.feedback;
            logEntry.mentorFeedback.rating = special.rating;
            logEntry.status = "approved";
        }

        logs.push(logEntry);
        dayNumber++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
}

fs.writeFileSync('e:/InternHub/backend/scripts/zoyara_lavanya_logs.json', JSON.stringify(logs, null, 2));
console.log(`Successfully generated ${logs.length} logs! saved to e:/InternHub/backend/scripts/zoyara_lavanya_logs.json`);
