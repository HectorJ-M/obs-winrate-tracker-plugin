import { InputWinLoss } from "../shared/ui/InputWinLoss.js";
import { DOMElement } from "../shared/ui/DomElement.js";
import { PageSettings } from "../pages/settings/PageSettings.js";
import { PageSource } from "../pages/source/PageSource.js";
import { Config } from "../shared/Config.js";
import { TEXT_WIN, TEXT_LOSS, TEXT_WIN_RATE, TEXT_WIN_SHORT, TEXT_LOSS_SHORT, TEXT_WIN_RATE_SHORT, TEXT_LAST_RECORD, TEXT_SAVE, TEXT_RESET } from "../shared/Constants.js";
export class Main {
    constructor() {
        this.container = document.getElementById("app");
        this.wins = 0;
        this.loss = 0;
        // Game time tracking
        this.gameStartTime = 0;
        this.previousGameStartTime = "0:00";
        this.previousGameEndTime = "0:00";
        this.locale = this.getLocale();
        this.config = Config.getInstance();
        this.readValues();
        this.config.readConfig();
        const hash = window.location.hash;
        if (hash === "#source") {
            this.showSources();
        }
        else if (hash === "#settings") {
            this.showSettings();
        }
        else {
            this.showDock();
        }
    }
    showSources() {
        const pageSource = new PageSource();
        pageSource.setText(this.getSourcesText());
        this.container.append(pageSource);
        addEventListener("storage", (event) => {
            switch (event.key) {
                case "wins":
                case "loss":
                case "gameStartTime":
                case "previousGameStartTime":
                case "previousGameEndTime":
                    this.readValues();
                    const sourceText = this.getSourcesText();
                    if (pageSource.getText() !== sourceText) {
                        pageSource.setText(sourceText);
                    }
                    break;
            }
        });
    }
    showDock() {
        const useSaveBtn = this.config.getUseSaveBtnValue();
        const showLastSaveInfo = this.config.getShowLastSaveInfoValue();
        const elLabelWinRate = new DOMElement("label", undefined, `${TEXT_WIN_RATE}: `).getEl();
        const elLastLabel = new DOMElement("label", { id: "last-record-label" }, TEXT_LAST_RECORD).getEl();
        const elBtnSave = new DOMElement("button", undefined, TEXT_SAVE).getEl();
        const elBtnReset = new DOMElement("button", undefined, TEXT_RESET).getEl();
        const elFooter = new DOMElement("div", { id: "footer" }).getEl();
        const elSettingsBtn = new DOMElement("button", { class: "small icon" }).getEl();
        this.elLastRecord = new DOMElement("p", undefined, this.getShortLastRecordText()).getEl();
        this.elInputWins = new InputWinLoss("input-wins", TEXT_WIN, this.wins);
        this.elInputLoss = new InputWinLoss("input-loss", TEXT_LOSS, this.loss);
        this.elValueWinRate = new DOMElement("span", undefined, this.getWinRateValue()).getEl();
        elBtnSave.addEventListener("click", () => this.saveRecords());
        elBtnReset.addEventListener("click", () => this.resetAllRecords());
        this.elInputWins.addEventListener("change", () => this.onInputChange(this.elInputWins, "wins"));
        this.elInputLoss.addEventListener("change", () => this.onInputChange(this.elInputLoss, "loss"));
        elSettingsBtn.addEventListener("click", () => this.openSettings());
        elSettingsBtn.append(new DOMElement("img", { src: "./build/static/images/settings_icon.svg" }).getEl());
        elFooter.append(elSettingsBtn);
        this.container.append(this.elInputWins.getEl(), this.elInputLoss.getEl(), elLabelWinRate, this.elValueWinRate, elLastLabel, this.elLastRecord, elBtnSave, elBtnReset, elFooter);
        if (!useSaveBtn) {
            elBtnSave.style.display = "none";
        }
        if (!showLastSaveInfo) {
            elLastLabel.style.display = "none";
            this.elLastRecord.style.display = "none";
        }
        window.addEventListener("storage", (event) => {
            if (event.key === "config") {
                this.config.readConfig();
                elBtnSave.style.display =
                    this.config.getUseSaveBtnValue()
                        ? "block"
                        : "none";
                const showLastSaveInfo = this.config.getShowLastSaveInfoValue();
                elLastLabel.style.display =
                    showLastSaveInfo
                        ? "block"
                        : "none";
                if (this.elLastRecord) {
                    this.elLastRecord.style.display =
                        showLastSaveInfo
                            ? "block"
                            : "none";
                }
            }
        });
    }
    showSettings() {
        const settings = new PageSettings();
        this.container.append(settings);
    }
    /**
     * Text displayed in the OBS Browser Source.
     *
     * Example:
     * Game 2: Win 1 | Lose 0 | Previous Game 1 Time 0:00 - 18:00
     */
    getSourcesText(format) {
        const game = this.wins + this.loss + 1;
        return `Game ${game}: Win ${this.wins} | Lose ${this.loss}\nPrevious Game : ${this.previousGameStartTime} - ${this.previousGameEndTime}`;
    }
    getShortLastRecordText() {
        if (this.lastRecord) {
            return this.lastRecord
                .replace(TEXT_WIN_RATE, TEXT_WIN_RATE_SHORT)
                .replace(TEXT_WIN, TEXT_WIN_SHORT)
                .replace(TEXT_LOSS, TEXT_LOSS_SHORT);
        }
        return "";
    }
    resetAllRecords() {
        // Start a completely new Game 1
        this.gameStartTime = Date.now();
        this.previousGameStartTime = "0:00";
        this.previousGameEndTime = "0:00";
        this.setLSValue("gameStartTime", this.gameStartTime.toString());
        this.setLSValue("previousGameStartTime", "0:00");
        this.setLSValue("previousGameEndTime", "0:00");
        this.setRecords(0, 0);
        this.saveRecords();
    }
    setRecords(wins, loss) {
        var _a, _b;
        if (wins !== undefined) {
            this.wins = wins;
        }
        if (loss !== undefined) {
            this.loss = loss;
        }
        this.lastRecord = this.getLastRecordText();
        (_a = this.elInputWins) === null || _a === void 0 ? void 0 : _a.setValue(this.wins);
        (_b = this.elInputLoss) === null || _b === void 0 ? void 0 : _b.setValue(this.loss);
        if (this.elLastRecord) {
            this.elLastRecord.innerText =
                this.getShortLastRecordText();
        }
        this.setWinRateValue();
    }
    saveRecords() {
        this.setLSValue("wins", this.wins.toString());
        this.setLSValue("loss", this.loss.toString());
        this.setLSValue("lastRecord", this.getLastRecordText());
        this.setLSValue("gameStartTime", this.gameStartTime.toString());
        this.setLSValue("previousGameStartTime", this.previousGameStartTime);
        this.setLSValue("previousGameEndTime", this.previousGameEndTime);
        this.setRecords();
    }
    getWinRateValue() {
        const result = this.wins
            ? (this.wins / (this.wins + this.loss) * 100)
            : 0;
        return result.toFixed(2) + "%";
    }
    getLastRecordText() {
        return `${this.getSourcesText()} \n ${this.getDateText()}`;
    }
    getDateText() {
        const date = new Date();
        return `${date.toLocaleDateString(this.locale)} (${date.toLocaleTimeString(this.locale)})`;
    }
    getLocale() {
        return navigator.language
            .substring(0, 2)
            .toLowerCase();
    }
    /**
     * Convert a timestamp into a clock time.
     *
     * Examples:
     * 18:00
     * 18:32
     * 1:05:12
     */
    formatGameTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const minutesText = minutes < 10
            ? `0${minutes}`
            : minutes.toString();
        const secondsText = seconds < 10
            ? `0${seconds}`
            : seconds.toString();
        if (hours > 0) {
            return `${hours}:${minutesText}:${secondsText}`;
        }
        return `${minutes}:${secondsText}`;
    }
    readValues() {
        const lsWins = this.getLSValue("wins");
        const lsLoss = this.getLSValue("loss");
        const lsLastRecord = this.getLSValue("lastRecord");
        const lsGameStartTime = this.getLSValue("gameStartTime");
        const lsPreviousGameStartTime = this.getLSValue("previousGameStartTime");
        const lsPreviousGameEndTime = this.getLSValue("previousGameEndTime");
        this.wins = lsWins
            ? parseInt(lsWins)
            : 0;
        this.loss = lsLoss
            ? parseInt(lsLoss)
            : 0;
        /*
         * If this is a brand-new tracker,
         * start Game 1 now.
         */
        if (lsGameStartTime) {
            this.gameStartTime =
                parseInt(lsGameStartTime);
        }
        else {
            this.gameStartTime = Date.now();
            this.setLSValue("gameStartTime", this.gameStartTime.toString());
        }
        this.previousGameStartTime =
            lsPreviousGameStartTime
                ? lsPreviousGameStartTime
                : "0:00";
        this.previousGameEndTime =
            lsPreviousGameEndTime
                ? lsPreviousGameEndTime
                : "0:00";
        this.lastRecord =
            lsLastRecord
                ? lsLastRecord
                : this.getLastRecordText();
    }
    getLSValue(key) {
        return window.localStorage.getItem(key);
    }
    setLSValue(key, value) {
        window.localStorage.setItem(key, value);
    }
    onInputChange(input, field) {
        if (!input) {
            return;
        }
        const newValue = input.getValue();
        /*
         * Make sure there is a starting timestamp.
         */
        if (this.gameStartTime === 0) {
            this.gameStartTime = Date.now();
        }
        /*
         * This is the moment the current game ends.
         */
        const currentTime = Date.now();
        /*
         * Save the time range for the game
         * that just ended.
         *
         * Example:
         *
         * Game 1
         * 0:00 -> 18:00
         */
        this.previousGameStartTime =
            this.formatGameTime(this.gameStartTime);
        this.previousGameEndTime =
            this.formatGameTime(currentTime);
        /*
         * The next game starts immediately
         * after the previous game ends.
         *
         * Example:
         *
         * Game 2 starts at 18:00
         */
        this.gameStartTime = currentTime;
        /*
         * Update the Win/Loss counter.
         */
        if (field === "wins") {
            this.wins = newValue;
        }
        else {
            this.loss = newValue;
        }
        this.setWinRateValue();
        /*
         * Save the timing information so
         * the OBS Browser Source can see it.
         */
        this.setLSValue("gameStartTime", this.gameStartTime.toString());
        this.setLSValue("previousGameStartTime", this.previousGameStartTime);
        this.setLSValue("previousGameEndTime", this.previousGameEndTime);
        /*
         * Automatically save if the setting
         * is enabled.
         */
        if (!this.config.getUseSaveBtnValue()) {
            this.saveRecords();
        }
    }
    setWinRateValue() {
        if (this.elValueWinRate) {
            this.elValueWinRate.innerText =
                this.getWinRateValue();
        }
    }
    openSettings() {
        window.open(`${window.location.href}#settings`, "_blank", "width=640,height=480");
    }
}
new Main();
//# sourceMappingURL=Main.js.map