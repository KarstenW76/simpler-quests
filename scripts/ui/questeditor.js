import { constants, objectiveState } from "../helpers/constants.js";
import { QuestDatabase } from "../data/database.js";
import { Quest } from "../data/quest.js";
import { Objective } from "../data/objective.js";
import { UIManager } from "./ui-manager.js";
import { Settings } from "../helpers/settings.js";
import { Select } from "../controls/select.js";

export class QuestEditor extends Application {
    // This dictionary makes it easier to load the options for the view styles.
    #viewStyles = Object.freeze({
        all: game.i18n.localize("SimplerQuests.Settings.ViewStyle.All"),
        next: game.i18n.localize("SimplerQuests.Settings.ViewStyle.Next"),
        complete: game.i18n.localize(
            "SimplerQuests.Settings.ViewStyle.Complete"
        ),
    });

    // Holds the base quest info. This is most important for editing quests.
    #quest;
    get quest() {
        return this.#quest;
    }

    constructor(options = {}) {
        super(options);

        // If the quest ID is given, load the quest info.
        if (options.questId) {
            this.#quest = QuestDatabase.getQuest(options.questId);
        } else {
            this.#quest = new Quest();
        }
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: constants.editorName,
            classes: [constants.moduleName, constants.editorName],
            template: "modules/simpler-quests/templates/editor.hbs",
            width: 300,
            height: 300,
            minimizable: false,
            resizable: true,
            title: game.i18n.localize("SimplerQuests.Editor.Title"),
        };
    }

    _getHeaderButtons() {
        return super._getHeaderButtons();
    }

    activateListeners($html) {
        super.activateListeners($html);

        // Create the listener for the save button.
        $html.find("button.save-quest").on("click", (evt) => {
            evt.preventDefault();

            // Get the title from the input
            let title = $html.find("#quest-title-input");
            if (title) title = title[0].value;

            // Get the quest objectives from the text.
            let text = $html.find("#quest-objective-input");
            if (text) text = text[0].value;

            // Parse the objectives into usable objects.
            const objs = Objective.parseMulti(text);

            // Get the display mode
            const selectBody = $html
                .find("#objective-display-select > .selection-bar > .body")
                .data("value");

            let q = new Quest({
                id: this.quest.id,
                title: title,
                objectives: objs,
                viewStyle: selectBody,
                visible: this.quest.visible,
            });

            QuestDatabase.InsertOrUpdate(q);
            console.log(q);
            UIManager.tracker.render();
            this.close();
        });

        // Quest visibility toggle.
        $html.find(".quest-visibility").on("click", (evt) => {
            this.#quest.visible = !this.quest.visible;
            this.render();
        });

        // Creates a usable dropdown menu.
        Select.setup($html);
    }

    async getData(options = {}) {
        // Create an empty collection of strings.
        // This is to convert the objectives back into
        // a text body for the user to interact with.
        let strings = [];

        // Iterate through each objective to convert individual
        // objectives into lines.
        this.quest.objectives.forEach((o) => {
            let line = "";
            // First, start by marking the quest as complete or failed if necessary.
            if (o.state === objectiveState.COMPLETE) line += "+";
            else if (o.state === objectiveState.FAILED) line += "-";

            // Mark the quest as a secret if needed.
            if (o.secret) line += "/";
            line += o.text;

            // Push the completed line to the stack.
            strings.push(line);
        });

        // Create the final text for the user to interact with.
        const objectiveString = strings.join("\n");

        const viewStyle =
            this.quest.viewStyle ||
            Settings.get(Settings.NAMES.QUEST_VIEW_STYLE);

        return foundry.utils.mergeObject(super.getData(), {
            title: "Quest Editor Test",
            questTitle: this.quest.title,
            objectives: objectiveString,
            visible: this.quest.visible,
            viewStyle: viewStyle,
            viewStyleHint: this.#viewStyles[viewStyle],
            showObjectiveOptions: true,
            /*[
                {id: 0, name: "Quest 1", objectives: "Do things\nNew Stuff" },
                {id: 1, name: "Quest 2", objectives: [] },
                {id: 2, name: "Quest 3", objectives: [] },
            ]*/
        });
    }

    async close(options) {
        return super.close(options);
    }

    async _render(force = false, options = {}) {
        await super._render(force, options);
    }
}
