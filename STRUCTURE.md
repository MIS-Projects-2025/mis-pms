PM CHECKLIST SYSTEM
System Documentation
Project Information

Project Name: PM Checklist System

Version: 1.0

Developed Using:

VS Code
Laravel (Backend API)
React.js (Frontend)
Workbench (MySQL Database)

### Introduction
Overview

The PM Checklist System is a web-based application designed to manage Preventive Maintenance (PM) checklists. The system allows authorized users to create, update, acknowledge, and verify maintenance checklists while maintaining data integrity and accountability through user-based workflows.

The system automates the recording of checklist information, tracks maintenance activities, and facilitates approval and verification processes among different users.


### Objectives

The system aims to:

Digitize preventive maintenance checklist processes.
Eliminate manual paper-based checklist records.
Provide accountability through user tracking.
Streamline acknowledgment and verification workflows.
Maintain checklist templates and checklist items.
Manage system users and access permissions.

###  System Features

### Checklist Creation

Users can create a new PM Checklist by providing:

Checklist Title
Due Date
Date Performed
Remarks (Optional)

The system automatically records:

Performed By (currently logged-in user)
Date Created
Status

Process Flow:

User Login 
    ↓
Create Checklist
    ↓
Enter Required Information
    ↓
Save Checklist
    ↓
System Records Performed By
    ↓
Checklist Created

### Checklist Acknowledgment

Some checklist records require acknowledgment from designated users.

Process
Checklist is submitted.
Assigned user receives checklist.
User reviews checklist.
User acknowledges completion.

Status Flow:

Created
   ↓
Pending Acknowledgment
   ↓
Acknowledged

### Checklist Verification

Certain checklist records require verification after completion.

Process
Checklist is completed.
Assigned verifier reviews the checklist.
Verifier approves or rejects the checklist.

Status Flow:

Created
   ↓
Pending Verification
   ↓
Verified

#### Checklist Item Maintenance

Administrators can maintain checklist templates.

Functions include:

Add Checklist Item
Edit Checklist Item
Remove Checklist Item
Activate/Deactivate Checklist Item

### User Management

Administrators can manage system users.

Functions
Create User
View User
Update User
Delete User
Assign Roles

### User Roles
Administrator

Permissions:

Manage Users
Manage Checklist Templates
Create Checklist
View All Checklists
Verify Checklists
Generate Reports

### Regular User

Permissions:

Create Checklist
View Own Checklists
Acknowledge Assigned Checklists

### Verifier

Permissions:

Review Submitted Checklists
Verify Checklists
Reject Checklists

### System Workflow

Checklist Lifecycle:

Draft
  ↓
Submitted
  ↓
Pending Acknowledgment
  ↓
Acknowledged
  ↓
Pending Verification
  ↓
Verified

Alternative Flow:

Draft
  ↓
Submitted
  ↓
Pending Verification
  ↓
Verified

### Database Design

### <<<<<<<<<<<<>>>>USERs>>>>>>>>>>>>
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `emp_name` varchar(255) NOT NULL,
  `emp_role` varchar(255) NOT NULL,
  `emp_jobtitle` varchar(45) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `emp_id` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<<<Computer Checklist>>>>>>>>>>>>>>>>>>
CREATE TABLE `computer_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `computer_name` varchar(100) DEFAULT NULL,
  `date_checked` varchar(45) DEFAULT NULL,
  `date_due` varchar(45) DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `items` longtext,
  `recommendations` longtext,
  `verified_by` varchar(45) DEFAULT NULL,
  `date_verified` varchar(45) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<Printer Checklist>>>>>>>>>>>>>>>>
CREATE TABLE `printer_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pm_date` varchar(100) DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `printer_name` varchar(100) DEFAULT NULL,
  `serial_num` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `next_pm` varchar(100) DEFAULT NULL,
  `items` longtext,
  `recommendations` longtext,
  `verified_by` varchar(45) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `date_verified` varchar(45) DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<<Boxing Printer Checklist>>>>>>>>>>>>>>>>>
CREATE TABLE `boxing_printer_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `performed_by` varchar(45) DEFAULT NULL,
  `date_performed` varchar(45) DEFAULT NULL,
  `shift` varchar(45) DEFAULT NULL,
  `items` longtext,
  `acknowledged_by` varchar(45) DEFAULT NULL,
  `date_acknowledged` varchar(45) DEFAULT NULL,
  `verified_by` varchar(45) DEFAULT NULL,
  `date_verified` varchar(45) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(45) DEFAULT NULL,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<<<<CCTV Checklist>>>>>>>>>>>>>>>>>>>
CREATE TABLE `cctv_lists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `camera_name` varchar(250) DEFAULT NULL,
  `channel` varchar(150) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `control_no` varchar(100) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `location_ip` varchar(150) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<<<Computer Repair || Report Checkllist>>>>>>>>>>>>>>>>>>
CREATE TABLE `computer_repair_tbl` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_no` varchar(255) DEFAULT NULL,
  `tech_id` varchar(45) DEFAULT NULL,
  `tech_name` varchar(45) DEFAULT NULL,
  `hardware_id` int DEFAULT NULL,
  `hostname` varchar(45) DEFAULT NULL,
  `serial_number` varchar(45) DEFAULT NULL,
  `model` varchar(45) DEFAULT NULL,
  `service_tag` varchar(45) DEFAULT NULL,
  `computer_type` varchar(45) DEFAULT NULL,
  `operating_system` varchar(45) DEFAULT NULL,
  `issued_to` varchar(45) DEFAULT NULL,
  `computer_issues` longtext,
  `items_checked` longtext,
  `summary_repairs` longtext,
  `technician_notes` longtext,
  `recommended_parts` longtext,
  `attachments` longtext,
  `product_no` varchar(45) DEFAULT NULL,
  `status` int DEFAULT NULL COMMENT '1-done/unfinished, 2-pending/unfinished',
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(45) DEFAULT NULL,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

### <<<<<<<<<<<<<<<<<<<Ladder Checklist>>>>>>>>>>>>>>>>>>>
CREATE TABLE `ladder_checklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `done_check` datetime DEFAULT NULL,
  `next_check` datetime DEFAULT NULL,
  `sections` longtext,
  `remarks` longtext,
  `first_inspected_by` varchar(255) DEFAULT NULL,
  `first_verified_by` varchar(255) DEFAULT NULL,
  `first_verified_date` datetime DEFAULT NULL,
  `second_inspected_by` varchar(255) DEFAULT NULL,
  `second_verified_by` varchar(255) DEFAULT NULL,
  `second_verified_date` datetime DEFAULT NULL,
  `inspected_by` varchar(45) DEFAULT NULL,
  `verified_by` varchar(45) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

┌─────────────────────┐
│        admin        │
├─────────────────────┤
│ admin_id (PK)       │
│ emp_id              │
│ emp_name            │
│ emp_role            │
│ emp_jobtitle        │
│ created_date        │
└──────────┬──────────┘
           │
           │ Used as
           │ Performed By /
           │ Verified By /
           │ Acknowledged By
           │
           ▼

┌─────────────────────┐
│ computer_checklists │
├─────────────────────┤
│ id (PK)             │
│ computer_name       │
│ date_checked        │
│ date_due            │
│ performed_by        │
│ verified_by         │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│ printer_checklists  │
├─────────────────────┤
│ id (PK)             │
│ printer_name        │
│ serial_num          │
│ location            │
│ performed_by        │
│ verified_by         │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│boxing_printer_check │
├─────────────────────┤
│ id (PK)             │
│ performed_by        │
│ acknowledged_by     │
│ verified_by         │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│   ladder_checklist  │
├─────────────────────┤
│ id (PK)             │
│ inspected_by        │
│ verified_by         │
│ first_inspected_by  │
│ first_verified_by   │
│ second_inspected_by │
│ second_verified_by  │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│ computer_repair_tbl │
├─────────────────────┤
│ id (PK)             │
│ tech_id             │
│ tech_name           │
│ report_no           │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│     cctv_lists      │
├─────────────────────┤
│ id (PK)             │
│ camera_name         │
│ location            │
│ created_by          │
│ updated_by          │
└─────────────────────┘


### Functional Requirements
FR-001
The system shall allow authenticated users to create PM Checklists.

FR-002
The system shall automatically capture the creator as the Performed By user.

FR-003
The system shall allow designated users to acknowledge checklist records.

FR-004
The system shall allow verifiers to approve or reject checklist records.

FR-005
The system shall allow administrators to manage checklist items.

FR-006
The system shall allow administrators to manage users.

### Non-Functional Requirements
Security
User authentication required.
Passwords encrypted using bcrypt.
Role-based access control.
Performance
System response time should not exceed 3 seconds.
Database transactions should be optimized.
Availability
System available during business hours.
Daily database backup.

### API Modules
Authentication
POST /api/login
POST /api/logout

### Conclusion

The PM Checklist System improves preventive maintenance operations by providing a centralized platform for checklist creation, acknowledgment, verification, and maintenance management. The system ensures accountability, traceability, and efficient monitoring of maintenance activities through automated workflows and user-based permissions.


