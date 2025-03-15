const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');
const validator = require('validator');

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const {
            organizationName,
            contactPerson,
            contactEmail,
            phoneNumber,
            address,
            type,
            notes
        } = req.body;

        // Validate input
        validatePartnerInput(organizationName, contactPerson, contactEmail, phoneNumber, address, type, notes);

        const connection = await pool.getConnection();

        try {
            // Store the partner in the database
            const sql = `
                INSERT INTO partners 
                (organization_name, contact_person, contact_email, phone_number, address, type, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await connection.execute(sql, [
                organizationName,
                contactPerson,
                contactEmail,
                phoneNumber,
                address,
                type,
                notes
            ]);

            return res.status(201).json({ message: "Partner added successfully" });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

function validatePartnerInput(organizationName, contactPerson, contactEmail, phoneNumber, address, type, notes) {
    // Organization name validation
    if (!organizationName || typeof organizationName !== 'string' || organizationName.length < 2) {
        throw new RouteError(
            new Error("Organization name must be at least 2 characters long"),
            400,
            "Organization name must be at least 2 characters long"
        );
    }

    // Contact person validation
    if (!contactPerson || typeof contactPerson !== 'string' || contactPerson.length < 2) {
        throw new RouteError(
            new Error("Contact person name must be at least 2 characters long"),
            400,
            "Contact person name must be at least 2 characters long"
        );
    }

    // Email validation
    if (!validator.isEmail(contactEmail)) {
        throw new RouteError(
            new Error("Invalid email address"),
            400,
            "Invalid email address"
        );
    }

    // Phone number validation (international format)
    if (!validator.isMobilePhone(phoneNumber, 'any')) {
        throw new RouteError(
            new Error("Invalid phone number format"),
            400,
            "Invalid phone number format"
        );
    }

    // Address validation
    const addressRegex = /^\d+\s+[A-Za-z0-9\s,.-]+$/;
    if (!addressRegex.test(address)) {
        throw new RouteError(
            new Error("Invalid address format. Must start with a number followed by street name"),
            400,
            "Invalid address format"
        );
    }

    // Type validation
    const validTypes = ['supplier', 'customer', 'vendor', 'distributor'];
    if (!validTypes.includes(type.toLowerCase())) {
        throw new RouteError(
            new Error("Invalid partner type"),
            400,
            "Invalid partner type. Must be one of: supplier, customer, vendor, distributor"
        );
    }

    // Notes validation (optional field)
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
        throw new RouteError(
            new Error("Notes must be a string with maximum 500 characters"),
            400,
            "Notes must be a string with maximum 500 characters"
        );
    }

    return true;
}

module.exports = router;
