const InstructorController = require('./src/controllers/InstructorController');

const methods = [
    'getDashboardOverview',
    'createCourse',
    'getCourses',
    'getCourseById',
    'updateCourse',
    'deleteCourse',
    'publishCourse',
    'createModule',
    'getCourseSections',
    'updateModule',
    'deleteModule',
    'createLesson',
    'getSectionLessons',
    'updateLesson',
    'deleteLesson',
    'createQuiz',
    'updateQuiz',
    'deleteQuiz',
    'getCourseStudents',
    'getCourseAnalytics',
    'createAnnouncement',
    'getAnnouncements',
    'deleteAnnouncement',
    'getSubmissions',
    'gradeSubmission',
    'getNotifications',
    'markNotificationRead',
    'markAllNotificationsRead',
    'deleteNotification'
];

methods.forEach(m => {
    console.log(`${m}: ${typeof InstructorController[m]}`);
});
