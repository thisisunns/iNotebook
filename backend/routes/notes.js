const express = require('express');
const router = express.Router();
var fetchuser = require("../middleware/fetchuser");
const Note = require('../models/Note');
const { body, validationResult } = require("express-validator");

//Route 1: Get All the notes using: GET "/api/notes/login".  login required
router.get('/fetchallnote', fetchuser, async (req, res) => {
    try {
        const note = await Note.find({ user: req.user.id });
        res.json(note)
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})

//Route 2: Add a new note using: GET "/api/notes/addnote".  login required
router.post('/addnote', fetchuser, [
    body("title", "Enter a valid title").isLength({ min: 3 }),
    body("description", "description must be atleast 5 Characters").isLength({ min: 5, }),], async (req, res) => {
        try {
            const { title, description, tag } = req.body;
            // if there are errors, return bad request and errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const note = new Note({
                title, description, tag, user: req.user.id
            })
            const savedNote = await note.save()
            res.json(savedNote)
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Internal server error");
        }
    })

//Route 3: Update an existing  note using: Put "/api/notes/updatenote".  login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    const { title, description, tag } = req.body;
    try {
        //create a newNote object 
        const newNote = {};
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        // find the note to be updated and update it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found") }
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
        res.json({ note });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})

//Route 4: delete an existing  note using: delete "/api/notes/deletenote".  login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
        // find the note to be deleted and delete it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not Found") }

        // Allow deletion if user owns this Note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "Success": "Note has been deleted", note: note });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
})
module.exports = router