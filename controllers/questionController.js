const { successmessage, errormessage } = require("../response/response");
const path = require("path");
const fs = require("fs");
const { selectQuestionData, selectSpecificQuestionData, addQuestion, deleteQuestion, editQuestion, addQuestionCsv, selectAllQuestionData, getFielteredData, getFielteredDataTotalCount } = require("../db/question");
const xlsx = require("xlsx");

const getAllQuestionData = async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL
        const response = await selectQuestionData(req.params.id);
        const returndata = response.map((data) => {
            return {
                ...data,
                answer: JSON.parse(data.answer),
                image: `${baseUrl}/category/` + data.image
            };
        })
        return res.status(200).json(successmessage(returndata));
    } catch (error) {
        return res.status(500).json(errormessage(error.message));
    }
};

const getFilteredData = async (req, res) => {

    try {
        if (req.type === 'user') {
            return res.status(401).json(errormessage('Unauthorized'));
        }

        const perPage = 50
        const pageNumber = req.query.page
        const skip = (pageNumber - 1) * perPage;

        const totalRecords = await getFielteredDataTotalCount(req.query.data, req.params.byQuiz);
        const response = await getFielteredData(req.query.data, req.params.byQuiz, perPage, skip);

        return res.status(200).json(successmessage({ data: response, perPage, totalPage: Math.ceil(totalRecords / perPage) }));
    } catch (error) {
        return res.status(500).json(errormessage(error.message));
    }
};

const getAllQuestionDataForAdmin = async (req, res) => {
    try {

        const response = await selectAllQuestionData();
        const returndata = response.map((data) => {
            return {
                ...data,
                answer: JSON.parse(data.answer),
            };
        })
        return res.status(200).json(successmessage(returndata));
    } catch (error) {
        return res.status(500).json(errormessage(error.message));
    }
};

const postAddExcelQuestion = async (req, res) => {
    try {
        if (req.type === 'user') {
            return res.status(401).json(errormessage('Unauthorized'));
        }

        const path = req.file.path
        const workbook = xlsx.readFile(path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(worksheet);
        const values = data.map(item => [
            item.question.trim().replace(/'/g, "''"),
            item.answer.replace(/'/g, "''"),
            item.correct,
            item.time,
            item.coins,
            item.quiz_id
        ]);
        const response = await addQuestionCsv(values);
        return res.status(200).json(successmessage(response));
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        }
        return res.status(500).json(errormessage(error.message));
    }
};

const postAddQuestion = async (req, res) => {
    try {
        const dbData = {
            question: req.body.question,
            answer: JSON.stringify(req.body.answer),
            correct: req.body.correct,
            quiz_id: parseInt(req.body.quizId),
            coins: req.body.coins
        }
        const response = await addQuestion(dbData);
        return res.status(200).json(successmessage("Add successfully"));
    } catch (error) {
        return res.status(500).json(errormessage(error.message));
    }
};

const getQuestion = async (req, res) => {
    try {
        if (req.type === 'user') {
            return res.status(401).json(errormessage('Unauthorized'));
        }

        const response = await selectSpecificQuestionData(req.params.id);
        return res.status(200).json(successmessage(response));
    } catch (error) {
        return res.status(500).json(errormessage(error.message));
    }
};

const postEditQuestion = async (req, res) => {
    try {
        if (req.type === 'user') {
            return res.status(401).json(errormessage('Unauthorized'));
        }
        const { question, answer, correct, quizId, coins } = req.body
        const getrecord = await selectSpecificQuestionData(req.params.id);
        if (getrecord) {
            const dbData = {
                question: question ? question : getrecord[0].question,
                answer: answer ? JSON.stringify(answer) : getrecord[0].answer,
                correct: correct ? correct : getrecord[0].correct,
                quiz_id: quizId ? parseInt(quizId) : getrecord[0].quiz_id,
                coins: coins ? coins : getrecord[0].coins
            }
            try {
                await editQuestion(getrecord[0].id, dbData);
                res.status(200).json(successmessage('Update Sucessfully'));
            } catch (error) {
                res.status(402).json(errormessage(error.message));
            }
        } else {
            res.status(402).json(errormessage("Data Not Found"));
        }
    } catch (error) {
        res.status(500).json(errormessage(error.message));
    }
};

const postDeleteQuestion = async (req, res) => {
    try {
        if (req.type === 'user') {
            return res.status(401).json(errormessage('Unauthorized'));
        }

        const getrecord = await selectSpecificQuestionData(req.params.id);
        if (getrecord) {
            try {
                await deleteQuestion(req.params.id);
                res.status(200).json(successmessage('Delete Sucessfully'));
            } catch (error) {
                res.status(402).json(errormessage(error.message));
            }
        } else {
            res.status(402).json(errormessage("Data Not Found"));
        }
    } catch (error) {
        res.status(500).json(errormessage(error.message));
    }
};

module.exports = {
    getAllQuestionData,
    postAddQuestion,
    getQuestion,
    postEditQuestion,
    postDeleteQuestion,
    postAddExcelQuestion,
    getAllQuestionDataForAdmin,
    getFilteredData
};