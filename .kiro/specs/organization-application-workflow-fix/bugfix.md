# Bugfix Requirements Document

## Introduction

The organization application workflow at `/apply` is currently broken due to a connection error when attempting to submit applications to the backend API. Users receive an `ERR_CONNECTION_REFUSED` error when trying to POST to `http://localhost:5000/auth/apply-organization`, preventing the entire organization onboarding flow from functioning. This bugfix addresses the connectivity issue to restore the complete workflow: application submission → platform admin approval → account creation → password setup → sign-in.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits an organization application at `/apply` THEN the system fails with `ERR_CONNECTION_REFUSED` error

1.2 WHEN the frontend attempts to POST to `http://localhost:5000/auth/apply-organization` THEN the connection is refused and no data is transmitted

1.3 WHEN the backend server is not running or not accessible at localhost:5000 THEN all organization application submissions fail

### Expected Behavior (Correct)

2.1 WHEN a user submits an organization application at `/apply` THEN the system SHALL successfully send the application data to the backend API

2.2 WHEN the frontend attempts to POST to `http://localhost:5000/auth/apply-organization` THEN the system SHALL establish a connection and receive a response from the backend

2.3 WHEN the backend server is running and accessible at localhost:5000 THEN the system SHALL process organization applications and route them to the platform admin approval queue

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an organization application is approved by platform admin THEN the system SHALL CONTINUE TO send account creation and password invitation emails to the organization email

3.2 WHEN an organization receives the password creation invitation THEN the system SHALL CONTINUE TO allow password setup via the invitation link

3.3 WHEN an organization completes password setup THEN the system SHALL CONTINUE TO allow sign-in with the created credentials

3.4 WHEN the platform admin views pending applications THEN the system SHALL CONTINUE TO display the approval/rejection interface

3.5 WHEN all other API endpoints are called THEN the system SHALL CONTINUE TO function as currently implemented
