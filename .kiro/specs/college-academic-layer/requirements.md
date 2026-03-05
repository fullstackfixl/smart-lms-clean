# Requirements Document

## Introduction

This document specifies requirements for the College Academic Layer feature, which enhances the existing multi-tenant LMS platform with academic structure capabilities specifically for COLLEGE organization types. The feature adds department management, semester tracking, subject organization, gradebook functionality, academic transcripts, and GPA calculation while maintaining strict tenant isolation and preserving all existing functionality for other organization types (School, Institute, Online Academy).

## Glossary

- **Platform**: The multi-tenant LMS system supporting multiple organization types
- **Organization**: A tenant entity with a specific type (School, Institute, College, Online Academy)
- **College_Organization**: An Organization with type set to "COLLEGE"
- **Department**: An academic division within a College_Organization
- **Semester**: A time-bound academic period within a College_Organization
- **Subject**: An academic course of study with defined credits within a Department and Semester
- **Course**: An instance of instruction that can optionally be linked to a Subject
- **Gradebook**: A module for recording and calculating student academic performance
- **Transcript**: A record of a student's academic performance across semesters
- **GPA**: Grade Point Average calculated from course grades and credits
- **CGPA**: Cumulative Grade Point Average across all semesters
- **Tenant_Isolation**: Security mechanism ensuring data access is restricted by organizationId
- **Module_Flag**: A configuration setting in modulesEnabled array controlling feature visibility
- **Instructor**: A user with role "Instructor" within an Organization
- **Student**: A user with role "Student" within an Organization
- **Org_Admin**: A user with role "Org Admin" within an Organization
- **Attendance_Threshold**: The minimum attendance percentage of 75%

## Requirements

### Requirement 1: Academic Structure Data Models

**User Story:** As an Org Admin, I want to organize courses into departments, semesters, and subjects, so that I can maintain proper academic structure for my college.

#### Acceptance Criteria

1. THE Platform SHALL store Department records with name, code, and organizationId fields
2. THE Platform SHALL store Semester records with name, number, startDate, endDate, and organizationId fields
3. THE Platform SHALL store Subject records with name, code, credits, departmentId, semesterId, and organizationId fields
4. THE Platform SHALL extend Course records to include subjectId, semesterId, departmentId, and credits fields
5. THE Platform SHALL enforce that all Department, Semester, and Subject records include a non-null organizationId
6. WHEN parsing Department data, THE Parser SHALL validate that code is unique within the organizationId
7. WHEN parsing Semester data, THE Parser SHALL validate that startDate occurs before endDate
8. WHEN parsing Subject data, THE Parser SHALL validate that credits is a positive number
9. FOR ALL valid academic structure objects, THE Pretty_Printer SHALL format them into valid JSON representations
10. FOR ALL valid academic structure JSON, parsing then printing then parsing SHALL produce an equivalent object

### Requirement 2: Tenant Isolation for Academic Data

**User Story:** As a Platform Admin, I want all academic data strictly isolated by organization, so that no tenant can access another tenant's data.

#### Acceptance Criteria

1. WHEN querying Department records, THE Platform SHALL filter results by the requesting user's organizationId
2. WHEN querying Semester records, THE Platform SHALL filter results by the requesting user's organizationId
3. WHEN querying Subject records, THE Platform SHALL filter results by the requesting user's organizationId
4. WHEN querying Grade records, THE Platform SHALL filter results by the requesting user's organizationId
5. IF a user attempts to access a Department with a different organizationId, THEN THE Platform SHALL return HTTP 403 error
6. IF a user attempts to access a Semester with a different organizationId, THEN THE Platform SHALL return HTTP 403 error
7. IF a user attempts to access a Subject with a different organizationId, THEN THE Platform SHALL return HTTP 403 error
8. IF a user attempts to access a Grade record with a different organizationId, THEN THE Platform SHALL return HTTP 403 error
9. THE Platform SHALL apply organizationId filtering in middleware before controller execution

### Requirement 3: Gradebook Module for Instructors

**User Story:** As an Instructor in a College, I want to enter and manage student grades, so that I can track academic performance and calculate final grades.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL display a Gradebook menu item in the Instructor sidebar
2. WHERE the Organization type is not "COLLEGE", THE Platform SHALL hide the Gradebook menu item from the Instructor sidebar
3. WHEN an Instructor accesses the Gradebook, THE Platform SHALL display a list of courses assigned to that Instructor
4. WHEN an Instructor selects a course, THE Platform SHALL display all students enrolled in that course
5. THE Platform SHALL allow Instructors to enter assignment marks for each student
6. THE Platform SHALL allow Instructors to enter quiz marks for each student
7. THE Platform SHALL allow Instructors to enter exam marks for each student
8. WHEN marks are entered, THE Platform SHALL calculate total marks as the sum of internal marks and exam marks
9. WHEN total marks are calculated, THE Platform SHALL calculate percentage as (total / maximum possible marks) × 100
10. WHEN percentage is calculated, THE Platform SHALL assign grade A for percentage greater than or equal to 90
11. WHEN percentage is calculated, THE Platform SHALL assign grade B for percentage greater than or equal to 75 and less than 90
12. WHEN percentage is calculated, THE Platform SHALL assign grade C for percentage greater than or equal to 60 and less than 75
13. WHEN percentage is calculated, THE Platform SHALL assign grade F for percentage less than 60
14. THE Platform SHALL store Grade records with studentId, courseId, semesterId, internalMarks, examMarks, total, grade, and organizationId fields
15. WHEN an Instructor saves grades, THE Platform SHALL validate that the Instructor is assigned to the course
16. IF an Instructor attempts to enter grades for a course not assigned to them, THEN THE Platform SHALL return HTTP 403 error

### Requirement 4: Attendance Summary for Instructors

**User Story:** As an Instructor in a College, I want to see attendance summaries on my dashboard, so that I can identify students who need intervention.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL display an Attendance Summary widget on the Instructor dashboard
2. WHEN displaying the Attendance Summary, THE Platform SHALL calculate attendance percentage for each student in the Instructor's courses
3. WHEN displaying the Attendance Summary, THE Platform SHALL highlight students with attendance below 75% in red
4. THE Platform SHALL calculate attendance percentage as (classes attended / total classes) × 100
5. THE Platform SHALL display the count of students below the Attendance_Threshold

### Requirement 5: Course Academic Information Display

**User Story:** As an Instructor in a College, I want to see academic information for my courses, so that I understand the academic context of what I'm teaching.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE" AND a Course has a linked Subject, THE Platform SHALL display a Course Academic Info panel
2. THE Platform SHALL display the Subject name in the Course Academic Info panel
3. THE Platform SHALL display the Subject credits in the Course Academic Info panel
4. THE Platform SHALL display the Semester name in the Course Academic Info panel
5. THE Platform SHALL display the Department name in the Course Academic Info panel
6. THE Platform SHALL render the Course Academic Info panel as read-only

### Requirement 6: Academic Overview for Students

**User Story:** As a Student in a College, I want to see an overview of my academic status, so that I can track my progress.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL display an Academic Overview widget on the Student dashboard
2. THE Platform SHALL display the current Semester name in the Academic Overview widget
3. THE Platform SHALL display the total credits enrolled in the Academic Overview widget
4. THE Platform SHALL display the current GPA in the Academic Overview widget
5. THE Platform SHALL display the overall attendance percentage in the Academic Overview widget
6. WHEN calculating total credits enrolled, THE Platform SHALL sum credits from all courses the student is enrolled in for the current semester
7. WHEN calculating GPA, THE Platform SHALL use the formula: sum of (grade points × credits) / total credits for the current semester
8. THE Platform SHALL map grade A to 4.0 grade points
9. THE Platform SHALL map grade B to 3.0 grade points
10. THE Platform SHALL map grade C to 2.0 grade points
11. THE Platform SHALL map grade F to 0.0 grade points

### Requirement 7: Academic Transcript for Students

**User Story:** As a Student in a College, I want to view my academic transcript, so that I can see my complete academic history.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE" AND the Module_Flag "GPA_REPORTS" is enabled, THE Platform SHALL display a Transcript menu item in the Student sidebar
2. WHEN a Student accesses the Transcript, THE Platform SHALL display grades grouped by semester
3. FOR each semester, THE Platform SHALL display course name, credits, internal marks, exam marks, and final grade
4. FOR each semester, THE Platform SHALL calculate and display the semester GPA
5. THE Platform SHALL calculate and display the CGPA across all semesters
6. WHEN calculating CGPA, THE Platform SHALL use the formula: sum of (grade points × credits for all semesters) / total credits across all semesters
7. THE Platform SHALL display semesters in chronological order by semester number
8. IF a Student has no grades recorded, THEN THE Platform SHALL display a message indicating no transcript data is available

### Requirement 8: Attendance Tracking for Students

**User Story:** As a Student in a College, I want to view my attendance records, so that I can ensure I meet attendance requirements.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL display an Attendance page in the Student interface
2. WHEN a Student accesses the Attendance page, THE Platform SHALL display attendance percentage for each enrolled course
3. WHEN displaying attendance, THE Platform SHALL highlight courses with attendance below 75% in red
4. THE Platform SHALL calculate course attendance as (classes attended for that course / total classes for that course) × 100
5. THE Platform SHALL display the total number of classes and attended classes for each course

### Requirement 9: Semester Filtering for Students

**User Story:** As a Student in a College, I want to filter my dashboard data by semester, so that I can focus on specific academic periods.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE" AND the Module_Flag "SEMESTERS" is enabled, THE Platform SHALL display a Semester Filter dropdown on the Student dashboard
2. WHEN a Student selects a semester from the filter, THE Platform SHALL update the Academic Overview widget to show data for that semester only
3. WHEN a Student selects a semester from the filter, THE Platform SHALL update the course list to show courses for that semester only
4. THE Platform SHALL populate the Semester Filter dropdown with all semesters for the student's organizationId
5. THE Platform SHALL set the default semester filter to the current semester based on current date

### Requirement 10: Department Management for Org Admins

**User Story:** As an Org Admin in a College, I want to create and manage departments, so that I can organize academic structure.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE" AND the Module_Flag "DEPARTMENTS" is enabled, THE Platform SHALL display a Departments menu item in the Org Admin sidebar
2. THE Platform SHALL allow Org Admins to create new Department records
3. THE Platform SHALL allow Org Admins to edit existing Department records within their organizationId
4. THE Platform SHALL allow Org Admins to delete Department records within their organizationId
5. WHEN creating a Department, THE Platform SHALL automatically set organizationId to the Org Admin's organizationId
6. WHEN creating a Department, THE Platform SHALL validate that the department code is unique within the organizationId
7. IF an Org Admin attempts to create a Department with a duplicate code, THEN THE Platform SHALL return a validation error
8. IF an Org Admin attempts to delete a Department with linked Subjects, THEN THE Platform SHALL return a validation error

### Requirement 11: Semester Management for Org Admins

**User Story:** As an Org Admin in a College, I want to create and manage semesters, so that I can organize academic periods.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE" AND the Module_Flag "SEMESTERS" is enabled, THE Platform SHALL display a Semesters menu item in the Org Admin sidebar
2. THE Platform SHALL allow Org Admins to create new Semester records
3. THE Platform SHALL allow Org Admins to edit existing Semester records within their organizationId
4. THE Platform SHALL allow Org Admins to delete Semester records within their organizationId
5. WHEN creating a Semester, THE Platform SHALL automatically set organizationId to the Org Admin's organizationId
6. WHEN creating a Semester, THE Platform SHALL validate that startDate is before endDate
7. IF an Org Admin attempts to create a Semester with startDate after endDate, THEN THE Platform SHALL return a validation error
8. IF an Org Admin attempts to delete a Semester with linked Subjects or Courses, THEN THE Platform SHALL return a validation error

### Requirement 12: Subject Management for Org Admins

**User Story:** As an Org Admin in a College, I want to create and manage subjects, so that I can define the curriculum.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL allow Org Admins to create new Subject records
2. THE Platform SHALL allow Org Admins to edit existing Subject records within their organizationId
3. THE Platform SHALL allow Org Admins to delete Subject records within their organizationId
4. WHEN creating a Subject, THE Platform SHALL automatically set organizationId to the Org Admin's organizationId
5. WHEN creating a Subject, THE Platform SHALL require selection of a Department from the same organizationId
6. WHEN creating a Subject, THE Platform SHALL require selection of a Semester from the same organizationId
7. WHEN creating a Subject, THE Platform SHALL validate that credits is a positive number
8. IF an Org Admin attempts to create a Subject with zero or negative credits, THEN THE Platform SHALL return a validation error
9. IF an Org Admin attempts to delete a Subject with linked Courses, THEN THE Platform SHALL return a validation error

### Requirement 13: Course-Subject Mapping

**User Story:** As an Org Admin in a College, I want to link courses to subjects, so that courses have proper academic context.

#### Acceptance Criteria

1. WHERE the Organization type is "COLLEGE", THE Platform SHALL allow Org Admins to assign a Subject to a Course
2. WHEN assigning a Subject to a Course, THE Platform SHALL automatically populate the Course's semesterId from the Subject
3. WHEN assigning a Subject to a Course, THE Platform SHALL automatically populate the Course's departmentId from the Subject
4. WHEN assigning a Subject to a Course, THE Platform SHALL automatically populate the Course's credits from the Subject
5. THE Platform SHALL allow Courses to exist without a linked Subject for backward compatibility
6. WHEN querying Subjects for Course assignment, THE Platform SHALL filter Subjects by the Course's organizationId

### Requirement 14: Preservation of Existing Functionality

**User Story:** As a user of any organization type, I want all existing features to continue working, so that the new College features do not disrupt my workflow.

#### Acceptance Criteria

1. THE Platform SHALL maintain all existing authentication functionality
2. THE Platform SHALL maintain all existing course management functionality
3. THE Platform SHALL maintain all existing live class functionality
4. THE Platform SHALL maintain all existing quiz functionality
5. THE Platform SHALL maintain all existing submission functionality
6. THE Platform SHALL maintain all existing attendance tracking functionality
7. THE Platform SHALL maintain all existing dashboard functionality for non-College organizations
8. WHERE the Organization type is "School", THE Platform SHALL hide all College-specific features
9. WHERE the Organization type is "Institute", THE Platform SHALL hide all College-specific features
10. WHERE the Organization type is "Online Academy", THE Platform SHALL hide all College-specific features
11. THE Platform SHALL maintain all existing routing patterns
12. THE Platform SHALL maintain all existing API endpoints

### Requirement 15: Module-Based Feature Visibility

**User Story:** As an Org Admin, I want to control which academic features are visible, so that I can customize the interface for my organization's needs.

#### Acceptance Criteria

1. THE Platform SHALL read the modulesEnabled array from the Organization configuration
2. WHERE "SEMESTERS" is in modulesEnabled, THE Platform SHALL display semester-related features
3. WHERE "SEMESTERS" is not in modulesEnabled, THE Platform SHALL hide semester-related features
4. WHERE "DEPARTMENTS" is in modulesEnabled, THE Platform SHALL display department-related features
5. WHERE "DEPARTMENTS" is not in modulesEnabled, THE Platform SHALL hide department-related features
6. WHERE "GPA_REPORTS" is in modulesEnabled, THE Platform SHALL display transcript and GPA features
7. WHERE "GPA_REPORTS" is not in modulesEnabled, THE Platform SHALL hide transcript and GPA features
8. THE Platform SHALL evaluate modulesEnabled flags independently for each Organization

### Requirement 16: Public Student Access Restrictions

**User Story:** As a Platform Admin, I want to ensure public students cannot access college academic features, so that academic data remains secure.

#### Acceptance Criteria

1. IF a user has public student status, THEN THE Platform SHALL deny access to Gradebook endpoints
2. IF a user has public student status, THEN THE Platform SHALL deny access to Transcript endpoints
3. IF a user has public student status, THEN THE Platform SHALL deny access to Department management endpoints
4. IF a user has public student status, THEN THE Platform SHALL deny access to Semester management endpoints
5. IF a user has public student status, THEN THE Platform SHALL deny access to Subject management endpoints
6. WHEN a public student attempts to access restricted endpoints, THE Platform SHALL return HTTP 403 error

### Requirement 17: Grade Calculation Consistency

**User Story:** As a Student, I want my grades calculated consistently, so that my academic record is accurate.

#### Acceptance Criteria

1. FOR ALL grade calculations, THE Platform SHALL use the same grade point mapping
2. FOR ALL GPA calculations, THE Platform SHALL use the same formula
3. WHEN a grade is updated, THE Platform SHALL recalculate GPA and CGPA automatically
4. THE Platform SHALL round GPA values to two decimal places
5. THE Platform SHALL round CGPA values to two decimal places
6. IF a course has no credits assigned, THEN THE Platform SHALL exclude it from GPA calculations
7. IF a student has no completed courses with grades, THEN THE Platform SHALL display GPA as 0.00

### Requirement 18: Data Validation and Error Handling

**User Story:** As a user, I want clear error messages when data validation fails, so that I can correct my input.

#### Acceptance Criteria

1. WHEN validation fails for Department creation, THE Platform SHALL return a descriptive error message
2. WHEN validation fails for Semester creation, THE Platform SHALL return a descriptive error message
3. WHEN validation fails for Subject creation, THE Platform SHALL return a descriptive error message
4. WHEN validation fails for Grade entry, THE Platform SHALL return a descriptive error message
5. IF a required field is missing, THEN THE Platform SHALL specify which field is required in the error message
6. IF a field value is invalid, THEN THE Platform SHALL specify the valid range or format in the error message
7. THE Platform SHALL return HTTP 400 status code for validation errors
8. THE Platform SHALL return HTTP 403 status code for authorization errors
9. THE Platform SHALL return HTTP 404 status code when requested resources are not found

### Requirement 19: Performance and Scalability

**User Story:** As a user, I want the academic features to perform efficiently, so that my workflow is not slowed down.

#### Acceptance Criteria

1. WHEN loading the Gradebook, THE Platform SHALL retrieve student data within 2 seconds for classes up to 100 students
2. WHEN calculating GPA, THE Platform SHALL complete the calculation within 500 milliseconds
3. WHEN loading the Transcript, THE Platform SHALL retrieve all semester data within 2 seconds
4. THE Platform SHALL use database indexes on organizationId for all academic tables
5. THE Platform SHALL use database indexes on foreign key fields for all academic tables
6. WHEN querying Subjects, THE Platform SHALL use a join to include Department and Semester data in a single query

### Requirement 20: Audit Trail for Grade Changes

**User Story:** As an Org Admin, I want to track when grades are modified, so that I can maintain academic integrity.

#### Acceptance Criteria

1. WHEN a grade is created, THE Platform SHALL record the timestamp and instructor who created it
2. WHEN a grade is updated, THE Platform SHALL record the timestamp and instructor who updated it
3. THE Platform SHALL store the previous grade value when a grade is updated
4. THE Platform SHALL allow Org Admins to view grade change history for their organizationId
5. THE Platform SHALL display grade change history showing date, instructor, old value, and new value
