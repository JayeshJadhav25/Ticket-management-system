const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const Joi = require('joi');
const mongoose = require('mongoose');

const createTicket = async (req, res) => {
    try {
        const { title, description, type, venue, status, priority, dueDate, createdBy } = req.body;

        const schema = Joi.object({
            title: Joi.string().min(3).max(100).required().messages({
                'string.base': 'Title should be a type of text',
                'string.min': 'Title should have at least 3 characters',
                'string.max': 'Title should have at most 100 characters',
                'any.required': 'Title is required'
            }),
            description: Joi.string().min(5).max(500).required().messages({
                'string.base': 'Description should be a type of text',
                'string.min': 'Description should have at least 5 characters',
                'string.max': 'Description should have at most 500 characters',
                'any.required': 'Description is required'
            }),
            type: Joi.string().valid('concert', 'conference', 'sports').required().messages({
                'string.base': 'Type should be a type of text',
                'any.required': 'Type is required',
                'string.valid': 'Type must be one of: concert, conference, sports'
            }),
            venue: Joi.string().min(3).max(100).required().messages({
                'string.base': 'Venue should be a type of text',
                'string.min': 'Venue should have at least 3 characters',
                'string.max': 'Venue should have at most 100 characters',
                'any.required': 'Venue is required'
            }),
            status: Joi.string().valid('open', 'in-progress', 'closed').required().messages({
                'string.base': 'Status should be a type of text',
                'any.required': 'Status is required',
                'string.valid': 'Status must be one of: open, in-progress, closed'
            }),
            priority: Joi.string().valid('low', 'medium', 'high').required().messages({
                'string.base': 'Priority should be a type of text',
                'any.required': 'Priority is required',
                'string.valid': 'Priority must be one of: low, medium, high'
            }),
            dueDate: Joi.date().greater('now').required().messages({
                'date.base': 'Due date must be a valid date',
                'any.required': 'Due date is required',
                'date.greater': 'Due date must be in the future'
            }),
            createdBy: Joi.string().required().messages({
                'string.base': 'Created By should be a type of text',
                'any.required': 'Created By is required'
            })
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const objectId = new mongoose.Types.ObjectId(createdBy);
        //check created by of valid user
        const user = await User.findOne({
            _id: objectId
        })

        if (!user) {
            return res.status(400).json({
                Message: "created by not a valid user id"
            })
        }

        const ticket = await Ticket.create({
            title,
            description,
            type,
            venue,
            status,
            priority,
            dueDate,
            createdBy
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Something Went Wrong"
        })
    }

};

// Assign user to a ticket
const assignUserToTicket = async (req, res) => {
    try {
        const { userId } = req.body;
        const ticketId = req.params.ticketId;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                message: 'Invalid ticket id'
            })
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid user id'
            })
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot assign users to a closed ticket' });
        }

        if (ticket.assignedUsers.includes(userId)) {
            return res.status(400).json({ message: 'User already assigned' });
        }

        if (ticket.assignedUsers.length >= 5) {
            return res.status(400).json({ message: 'User assignment limit reached' });
        }

        const objectId = new mongoose.Types.ObjectId(userId);

        const user = await User.findOne({
            _id: objectId
        })


        if (!user) {
            return res.status(400).json({
                Message: "created by not a valid user id"
            })
        }

        ticket.assignedUsers.push(userId);
        await ticket.save();
        res.json({ message: 'User assigned successfully' });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Something Went Wrong"
        })
    }

};

// Get ticket details
const getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                message: 'Invalid ticket id'
            })
        }

        const ticket = await Ticket.findById(ticketId).populate('assignedUsers', 'name email');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        res.json({
            id: ticket._id,
            title: ticket.title,
            description: ticket.description,
            type: ticket.type,
            venue: ticket.venue,
            status: ticket.status,
            priority: ticket.priority,
            dueDate: ticket.dueDate,
            createdBy: ticket.createdBy,
            assignedUsers: ticket.assignedUsers,
            statistics: {
                totalAssigned: ticket.assignedUsers.length,
                status: ticket.status
            }
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Something Went Wrong"
        })
    }

};

// Analytics for past tickets
const getTicketAnalytics = async (req, res) => {
    const filters = { ...req.query };

    const tickets = await Ticket.find(filters);
    const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
    const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
    const inProgressTickets = tickets.filter(ticket => ticket.status === 'in-progress').length;

    res.json({
        totalTickets: tickets.length,
        closedTickets,
        openTickets,
        inProgressTickets,
        tickets
    });
};

module.exports = { createTicket, assignUserToTicket, getTicketDetails, getTicketAnalytics };
