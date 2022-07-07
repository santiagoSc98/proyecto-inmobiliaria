const controller = {};
const stateService = require("../services/stateService")
const path = require("path");

controller.renderView = async function (req, res) {
    try {
        let allStates = await stateService.list()
        res.render("index", {
            rows: allStates,
        });
    } catch (error) {
        return error
    }
}

module.exports = controller;