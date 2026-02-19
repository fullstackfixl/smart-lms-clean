const mongoose = require('mongoose');
const { Organization, User, Course, Section, Lesson, Enrollment } = require('../models');

// Configure Mongoose
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://dushyant4665fixlsolution_db_user:7358ABmkGBLRMP8D@cluster0.r9k9vap.mongodb.net/smart-lms?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Connection error:', error.message);
        process.exit(1);
    }
}

async function verifyLessonPlayer() {
    await connectDB();

    const prefix = `verify_lp_${Date.now()}`;
    console.log(`Using prefix: ${prefix}`);

    try {
        // 1. Setup Data
        const org = await Organization.create({
            name: `${prefix}_Org`,
            slug: `${prefix}_org`,
            code: `${prefix}_CODE`,
            status: 'active'
        });

        const instructor = await User.create({
            name: 'Instructor',
            email: `${prefix}_inst@example.com`,
            password_hash: 'hashed',
            role: 'instructor',
            organization_id: org._id
        });

        const student = await User.create({
            name: 'Student',
            email: `${prefix}_stud@example.com`,
            password_hash: 'hashed',
            role: 'student',
            organization_id: org._id
        });

        const course = await Course.create({
            title: `${prefix} Course`,
            description: 'Desc',
            instructor_id: instructor._id,
            organization_id: org._id,
            status: 'published',
            price: 0,
            category: 'Development'
        });

        const section = await Section.create({
            course_id: course._id,
            organization_id: org._id,
            title: 'Section 1',
            order: 1
        });

        const videoLesson = await Lesson.create({
            course_id: course._id,
            organization_id: org._id,
            section_id: section._id,
            title: 'Video Lesson',
            type: 'video',
            content: { videoUrl: 'http://example.com/video.mp4', videoDuration: 100 },
            order: 1
        });

        const quizLesson = await Lesson.create({
            course_id: course._id,
            organization_id: org._id,
            section_id: section._id,
            title: 'Quiz Lesson',
            type: 'quiz',
            content: {
                questions: [
                    { question: 'Q1', options: ['A', 'B'], correctAnswer: 0, points: 1 }
                ],
                passingScore: 50
            },
            order: 2
        });

        // Enroll Student
        const enrollment = await Enrollment.create({
            organization_id: org._id,
            course_id: course._id,
            student_id: student._id,
            enrollmentType: 'free',
            status: 'active',
            progress: {
                completedLessons: [],
                totalLessons: 2,
                completionPercentage: 0
            }
        });
        console.log('✅ Setup complete. Enrollment created.');

        // 2. Test Logic (Simulating endpoints)

        // GET /lectures/:id (Video)
        // We can't call express route directly easily without mocking req/res, 
        // but we can simulate the logic: find lesson, check enrollment, check org.
        const retrievedLesson = await Lesson.findById(videoLesson._id);
        if (!retrievedLesson) throw new Error('Lesson not found');

        // Check access
        const accessCheck = await Enrollment.findOne({
            student_id: student._id,
            course_id: retrievedLesson.course_id,
            status: { $in: ['active', 'completed'] }
        });
        console.log(`Access check for video: ${!!accessCheck}`); // Should be true

        // UPDATE PROGRESS (Video)
        // Logic: if watched > 90%, mark complete.
        const watchedSeconds = 95; // 95% of 100
        if (watchedSeconds >= retrievedLesson.content.videoDuration * 0.9) {
            // Mocking the model method call
            // We need to re-fetch enrollment to get the instance with methods if we used model.create
            // (Actually mongoose create returns instance, but let's be safe)
            const e = await Enrollment.findById(enrollment._id);
            e.completeLesson(videoLesson._id, watchedSeconds);
            await e.save();
            console.log('✅ Video lesson marked complete via model method.');
        }

        // Verify Progress
        const updatedEnrollment = await Enrollment.findById(enrollment._id);
        console.log(`Completion % after video: ${updatedEnrollment.progress.completionPercentage}`);
        if (updatedEnrollment.progress.completionPercentage === 50) {
            console.log('✅ TEST PASSED: 50% completion after 1/2 lessons.');
        } else {
            console.error(`❌ TEST FAILED: Expected 50% completion, got ${updatedEnrollment.progress.completionPercentage}`);
        }

        // SUBMIT QUIZ
        // Logic: check answers, update score
        const answers = [0]; // Correct answer
        let correctCount = 0;
        quizLesson.content.questions.forEach((q, i) => {
            if (q.correctAnswer === answers[i]) correctCount++;
        });
        const score = (correctCount / quizLesson.content.questions.length) * 100;
        const passed = score >= quizLesson.content.passingScore;

        if (passed) {
            updatedEnrollment.completeLesson(quizLesson._id, 0, score);
            await updatedEnrollment.save();
            console.log('✅ Quiz lesson marked complete via model method.');
        }

        // Verify Final Progress
        const finalEnrollment = await Enrollment.findById(enrollment._id);
        console.log(`Completion % after quiz: ${finalEnrollment.progress.completionPercentage}`);
        console.log(`Course Status: ${finalEnrollment.status}`);

        if (finalEnrollment.progress.completionPercentage === 100) {
            console.log('✅ TEST PASSED: 100% completion.');
        } else {
            console.error(`❌ TEST FAILED: Expected 100% completion, got ${finalEnrollment.progress.completionPercentage}`);
        }

        if (finalEnrollment.status === 'completed') {
            console.log('✅ TEST PASSED: Enrollment status is completed.');
        } else {
            console.error(`❌ TEST FAILED: Expected status 'completed', got ${finalEnrollment.status}`);
        }


    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

verifyLessonPlayer();
