const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidphone = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    return true;
}
const isValidPassword = function (value) {
    if (value.length > 7 && value.length < 16) { return true }
};

//Create Api
const registerUser = async function (req, res) {
    try {
        // Extract params
        const requestBody = req.body;
        let { title, name, phone, email, password, address } = requestBody; // Object destructing
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide user details' })
            return
        }
        // Validation starts
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'Title is required' })
            return
        }
        title = title.trim()
        if (!isValidTitle(title)) {
            res.status(400).send({ status: false, message: `Title should be among Mr, Mrs, Miss` })
            return
        }
        if (!isValid(name.trim())) {
            res.status(400).send({ status: false, message: ' name is required' })
            return
        }
        if (!isValidphone(phone, 'String')) {
            res.status(400).send({ status: false, message: "phone number is required" })
            return
        }
        //mobile number validation
        if (!(/^\d{10}$/.test(phone))) {
            res.status(400).send({ status: false, message: `phone number  should be a valid` })
            return
        }
        const isphoneAlreadyUsed = await userModel.findOne({ phone })
        if (isphoneAlreadyUsed) {
            res.status(400).send({ status: false, message: `this phone number ${phone} is already used, try another one` })
            return
        }
        if (!isValid(email.trim())) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email} email address is already registered` })
            return
        }
        if (!isValid(password.trim())) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        if (!isValidPassword(password.trim())) {
            res.status(400).send({ status: false, message: `Password must contain characters between 8 to 15` })
            return
        }
        if (isValid(address)) { }
        // Validation ends

        const userData = { title, name, phone, email, password, address }
        const newUser = await userModel.create(userData);
        res.status(201).send({ status: true, message: `user created successfully`, data: newUser });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}




const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValid(requestBody.email)) {
            res.status(400).send({ status: false, message: 'email key is required' })
            return
        }
        if (!isValid(requestBody.password)) {
            res.status(400).send({ status: false, message: 'password key is required' })
            return
        }
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
            return
        }
        // Extract params
        const { email, password } = requestBody;
        // Validation starts
        if (!isValid(email.trim())) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password.trim())) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        // Validation ends
        const user = await userModel.findOne({ email, password });
        if (!user) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        const token = await jwt.sign({ userId: user._id }, 'radium', {
            expiresIn: "2h"
        })
        res.header('x-api-key', token);
        res.status(200).send({ status: true, message: `user login successfull`, data: { token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}
module.exports = { registerUser, loginUser }

