const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    let { name, email, password } = req.body;

    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required().messages({
            'string.base': 'Name should be a type of text',
            'string.min': 'Name should have at least 3 characters',
            'string.max': 'Name should have at most 30 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().email().required().messages({
            'string.base': 'Email should be a type of text',
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
        password: Joi.string()
            .min(8)
            .max(20)
            .pattern(/[A-Z]/, 'uppercase')
            .pattern(/[a-z]/, 'lowercase')
            .pattern(/[0-9]/, 'number')
            .pattern(/[^A-Za-z0-9]/, 'special character')
            .required()
            .messages({
                'string.base': 'Password should be a type of text',
                'string.min': 'Password should have at least 8 characters',
                'string.max': 'Password should have at most 20 characters',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'Password is required'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password });
    if (user) {
        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.base': 'Email should be a type of text',
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'string.base': 'Password should be a type of text',
            'any.required': 'Password is required'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (user && isPasswordCorrect) {
        res.json({
            token: generateToken(user._id)
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { registerUser, loginUser };
