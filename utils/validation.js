const { RouteError } = require('../middleware/errorMiddleware');

function validateEventInput(data) {
    const { eventName,
        eventDateTime,
        organizer,
        address,
        notes } = data;

        const title = eventName;
        const event_datetime = eventDateTime;
        const location = address;


    console.log(title)

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new RouteError(
            new Error("Invalid title"),
            400,
            "Title is required and must be a non-empty string"
        );
    }

    if (!event_datetime || isNaN(Date.parse(event_datetime))) {
        throw new RouteError(
            new Error("Invalid event datetime"),
            400,
            "Event datetime must be a valid date"
        );
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
        throw new RouteError(
            new Error("Invalid location"),
            400,
            "Location is required and must be a non-empty string"
        );
    }

    if (!organizer || typeof location !== 'string' || location.trim().length === 0) {
        throw new RouteError(
            new Error("Invalid organizer"),
            400,
            "Organizer is required and must be a non-empty string"
        );
    }
}

module.exports = {
    validateEventInput
};
