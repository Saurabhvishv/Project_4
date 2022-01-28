const mongoose = require('mongoose')
const userModel = require('../models/userModel')
const bookModel = require('../models/bookModel')
const reviewModel = require('../models/reviewModel')
const aws = require("aws-sdk");

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
const validateDate = function (value) {
    var pattern = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
    if (value == null || value == "" || !pattern.test(value)) {
        //errMessage += "Invalid date of birth\n";
        return false;
    }
    else {
        return true
    }
}
//file upload

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
    region: "ap-south-1" // Mumbai region
});

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { // exactly 

        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket", // HERE
            Key: "pk_newFolder/folderInsideFolder/oneMore/foo/" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
            Body: file.buffer,
        };

        // Callback - function provided as the second parameter ( most oftenly)
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            console.log(data)
            console.log(`File uploaded successfully. ${data.Location}`);
            return resolve(data.Location); //HERE 
        });
    });
};

const awsFile = async function (req, res) {
    try {
        let files = req.files;
        if (files && files.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            let uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output 
            res.status(201).send({ status: true, data: uploadedFileURL });

        }
        else {
            res.status(400).send({ status: false, msg: "No file to write" });
        }

    }
    catch (e) {
        console.log("error is: ", e);
        res.status(500).send({ status: false, msg: "Error in uploading file to s3" });
    }

};

//Create APi
const createBook = async function (req, res) {
    try {
        const requestBody = req.body;
        const userIdFromToken = req.userId
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide book details' })
            return
        }
        if (!isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }
        // Extract params
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = requestBody;
        // Validation starts
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: 'Book Title is required' })
            return
        }
        const isTitleAlreadyUsed = await bookModel.findOne({ title }); // {title:title}
        if (isTitleAlreadyUsed) {
            res.status(400).send({ status: false, message: `${title} title is already registered` })
            return
        }
        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: 'excerpt is required' })
            return
        }
        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: 'user id is required' })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(400).send({ status: false, message: `user does not exit` })
            return
        }
        if (userId !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        if (!isValid(ISBN)) {
            res.status(400).send({ status: false, message: 'Book ISBN is required' })
            return
        }
        const isIsbnAlreadyUsed = await bookModel.findOne({ ISBN })
        if (isIsbnAlreadyUsed) {
            res.status(400).send({ status: false, message: `${ISBN} ISBN address is already registered` })
            return
        }
        if (!isValid(category)) {
            res.status(400).send({ status: false, message: 'Book category is required' })
            return
        }
        if (!isValid(subcategory)) {
            res.status(400).send({ status: false, message: ' subcategory is required' })
            return
        }
        if (!isValid(releasedAt)) {
            res.status(400).send({ status: false, message: 'Book released date is required' })
            return
        }
        if (!validateDate(releasedAt)) {
            res.status(400).send({ status: false, message: 'releasedAt should be an date and format("YYYY-MM-DD")' })
            return
        }
        // Validation ends
        const reviews = 0;
        const bookData = { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt }
        const createdBook = await bookModel.create(bookData)
        return res.status(201).send({ status: true, message: 'New book created successfully', data: createdBook })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message });
    }
}





const getBooks = async function (req, res) {

    try {
        const queryParams = req.query
        let filterQuery = { isDeleted: false, deletedAt: null }
        let { userId, category, subcategory } = queryParams


        if (userId) {
            filterQuery["userId"] = userId
        }
        if (category) {
            filterQuery["category"] = category
        }

        if (subcategory) {
            filterQuery["subcategory"] = subcategory
        }

        let book = await bookModel.find(filterQuery)
        const book1 = await bookModel.find(filterQuery).select({ "_id": 1, "title": 1, "excerpt": 1, "userId": 1, "category": 1, "releasedAt": 1, "reviews": 1 }).sort({ "title": 1 })



        var book2 = book1.sort(SortArray);

        if (book.length > 0) {
            res.status(200).send({ status: true, message: 'Books list', data: book2 })
        }
        else {
            res.status(404).send({ msg: "book not find" })
        }



    } catch (error) {
        res.status(500).send({ status: true, message: error.message })
    }

}

const getBooksById = async function (req, res) {

    try {

        
        if (!(isValid(req.params.bookId) && isValidObjectId(req.params.bookId))) {
            return res.status(400).send({ status: false, msg: "bookId is not valid" })
        }
        
        let tempbook = await bookModel.findOne({ _id: req.params.bookId, isDeleted: false })
        

        if (tempbook) {
            
            let reviews = await reviewModel.find({ bookId: req.params.bookId ,isDeleted:false})
            let reviewCount=reviews.length
            
            if (reviews.length > 0) {

                tempbook.reviews=reviewCount
                res.status(200).send({ status: true, data:{
                    ...tempbook.toObject(), reviewData:reviews 
                }})
                return
            } else {
                res.status(200).send({ status: false, data:{
                    ...tempbook.toObject(), reviewData:reviews 
                } })
            }
        } else {
            res.status(404).send({ status: false, msg: "book not exist" })
            return
        }

    } catch (err) {

        console.log(err)
        res.status(500).send({error: err.message })
}
}




const updateBook = async function (req, res) {
    try {
        const _id = req.params.bookId
        let requestBody = req.body
        const userIdFromToken = req.userId

        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "Please provide valid data in request body" })
            return
        }

        if (!isValidObjectId(_id)) {
            res.status(400).send({ status: false, message: "bookId should be valid" })
            return
        }

        let bookDetails = await bookModel.findOne({ _id, isDeleted: false })

        if (!bookDetails) {
            res.status(404).send({ status: false, message: "No book found" })
            return
        }
        let { title, excerpt, ISBN, releasedAt } = requestBody
        let updateData = {}
        if (bookDetails.userId.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: "You are not authorised" })
            return
        }
        if (title) {

            if (!isValid(title)) {
                res.status(400).send({ status: false, message: "Title should have some value" })
                return
            }
            title = String.prototype.trim.call(title)
            let isTitleAlreadyUsed = await bookModel.findOne({ title })

            if (isTitleAlreadyUsed) {
                res.status(400).send({ status: false, message: "Title is already in use, try something different" })
                return
            }
            updateData['title'] = title
        }
        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: "excerpt should have some value" })
            return
        }
        excerpt = excerpt.trim()
        updateData['excerpt'] = excerpt
        if (!isValid(ISBN)) {
            res.status(400).send({ status: false, message: "ISBN should have some value" })
            return
        }

        ISBN = String.prototype.trim.call(ISBN)
        let isIsbnAlreadyUsed = await bookModel.findOne({ ISBN })

        if (isIsbnAlreadyUsed) {
            res.status(400).send({ status: false, message: "ISBN is already in use, try something different" })
            return
        }
        updateData['ISBN'] = ISBN


        if (!Date.parse(releasedAt)) {
            res.status(400).send({ status: false, message: `releasedAt should be an date and format("YYYY-MM-DD")` })
            return
        }
        updateData['releasedAt'] = releasedAt


        if (!isValidRequestBody(updateData)) {
            res.status(400).send({ status: false, message: "Please provide correct updating data " })
            return
        }


        let udatedBookDetails = await bookModel.findOneAndUpdate({ _id }, updateData, { new: true })
        return res.status(200).send({ status: true, message: 'Book details updated successfully', data: udatedBookDetails })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


const deleteBookByID = async function (req, res) {
    try {
        const params = req.params
        const bookId = params.bookId
        const userIdFromToken = req.userId

        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid book id` })
            return
        }

        if (!isValidObjectId(userIdFromToken)) {
            res.status(400).send({ status: false, message: `${userIdFromToken} is not a valid token id` })
            return
        }

        const Book = await bookModel.findOne({ _id: bookId, isDeleted: false, deletedAt: null })

        if (!Book) {
            res.status(404).send({ status: false, message: `Book not found` })
            return
        }

        if (Book.userId.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }

        await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        res.status(200).send({ status: true, message: `Book deleted successfully`,})
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { createBook, getBooks, getBooksById, updateBook, deleteBookByID }