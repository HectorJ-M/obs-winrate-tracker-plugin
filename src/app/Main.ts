import {InputWinLoss} from "../shared/ui/InputWinLoss.js";
import {DOMElement} from "../shared/ui/DomElement.js";
import {PageSettings} from "../pages/settings/PageSettings.js";
import {PageSource} from "../pages/source/PageSource.js";
import {Config} from "../shared/Config.js";
import {
    TEXT_WIN, TEXT_LOSS, TEXT_WIN_RATE,
    TEXT_WIN_SHORT, TEXT_LOSS_SHORT, TEXT_WIN_RATE_SHORT,
    TEXT_LAST_RECORD, TEXT_SAVE, TEXT_RESET
} from "../shared/Constants.js";

export class Main {

    private container:HTMLDivElement = document.getElementById("app") as HTMLDivElement;

    private wins:number = 0;
    private loss:number = 0;
    private lastRecord:string | undefined;

    // Game time tracking
    private gameStartTime:number = 0;
    private previousGameStartTime:string = "0:00";
    private previousGameEndTime:string = "0:00";

    private locale:string = this.getLocale();

    private elInputWins:InputWinLoss | undefined;
    private elInputLoss:InputWinLoss | undefined;
    private elValueWinRate:HTMLLabelElement | undefined;
    private elLastRecord:HTMLParagraphElement | undefined;

    private config:Config = Config.getInstance();

    constructor() {
        this.readValues();
        this.config.readConfig();

        const hash:string = window.location.hash;

        if(hash === "#source") {
            this.showSources();
        } else if(hash === "#settings") {
            this.showSettings();
        } else {
            this.showDock();
        }
    }

    private showSources():void {
        const pageSource:PageSource = new PageSource();

        pageSource.setText(this.getSourcesText());
        this.container.append(pageSource);

        addEventListener("storage", (event:StorageEvent):void => {
            switch(event.key) {
                case "wins":
                case "loss":
                case "gameStartTime":
                case "previousGameStartTime":
                case "previousGameEndTime":

                    this.readValues();

                    const sourceText:string = this.getSourcesText();

                    if(pageSource.getText() !== sourceText) {
                        pageSource.setText(sourceText);
                    }

                    break;
            }
        });
    }


    private showDock():void {
        const useSaveBtn:boolean = this.config.getUseSaveBtnValue();
        const showLastSaveInfo:boolean = this.config.getShowLastSaveInfoValue();

        const elLabelWinRate = new DOMElement(
            "label",
            undefined,
            `${TEXT_WIN_RATE}: `
        ).getEl();

        const elLastLabel:HTMLLabelElement = new DOMElement(
            "label",
            {id: "last-record-label"},
            TEXT_LAST_RECORD
        ).getEl() as HTMLLabelElement;

        const elBtnSave:HTMLButtonElement = new DOMElement(
            "button",
            undefined,
            TEXT_SAVE
        ).getEl() as HTMLButtonElement;

        const elBtnReset:HTMLButtonElement = new DOMElement(
            "button",
            undefined,
            TEXT_RESET
        ).getEl() as HTMLButtonElement;

        const elFooter:HTMLDivElement = new DOMElement(
            "div",
            {id: "footer"}
        ).getEl() as HTMLDivElement;

        const elSettingsBtn:HTMLButtonElement = new DOMElement(
            "button",
            {class: "small icon"}
        ).getEl() as HTMLButtonElement;

        this.elLastRecord = new DOMElement(
            "p",
            undefined,
            this.getShortLastRecordText()
        ).getEl() as HTMLParagraphElement;

        this.elInputWins = new InputWinLoss(
            "input-wins",
            TEXT_WIN,
            this.wins
        );

        this.elInputLoss = new InputWinLoss(
            "input-loss",
            TEXT_LOSS,
            this.loss
        );

        this.elValueWinRate = new DOMElement(
            "span",
            undefined,
            this.getWinRateValue()
        ).getEl() as HTMLLabelElement;

        elBtnSave.addEventListener(
            "click",
            ():void => this.saveRecords()
        );

        elBtnReset.addEventListener(
            "click",
            ():void => this.resetAllRecords()
        );

        this.elInputWins.addEventListener(
            "change",
            ():void => this.onInputChange(this.elInputWins, "wins")
        );

        this.elInputLoss.addEventListener(
            "change",
            ():void => this.onInputChange(this.elInputLoss, "loss")
        );

        elSettingsBtn.addEventListener(
            "click",
            ():void => this.openSettings()
        );

        elSettingsBtn.append(
            new DOMElement(
                "img",
                {src: "./build/static/images/settings_icon.svg"}
            ).getEl() as HTMLImageElement
        );

        elFooter.append(elSettingsBtn);

        this.container.append(
            this.elInputWins.getEl(),
            this.elInputLoss.getEl(),
            elLabelWinRate,
            this.elValueWinRate,
            elLastLabel,
            this.elLastRecord,
            elBtnSave,
            elBtnReset,
            elFooter
        );

        if(!useSaveBtn) {
            elBtnSave.style.display = "none";
        }

        if(!showLastSaveInfo) {
            elLastLabel.style.display = "none";
            this.elLastRecord.style.display = "none";
        }

        window.addEventListener(
            "storage",
            (event:StorageEvent):void => {

                if(event.key === "config") {

                    this.config.readConfig();

                    elBtnSave.style.display =
                        this.config.getUseSaveBtnValue()
                            ? "block"
                            : "none";

                    const showLastSaveInfo:boolean =
                        this.config.getShowLastSaveInfoValue();

                    elLastLabel.style.display =
                        showLastSaveInfo
                            ? "block"
                            : "none";

                    if(this.elLastRecord) {
                        this.elLastRecord.style.display =
                            showLastSaveInfo
                                ? "block"
                                : "none";
                    }
                }
            }
        );
    }


    private showSettings():void {
        const settings:PageSettings = new PageSettings();

        this.container.append(settings);
    }


    /**
     * Text displayed in the OBS Browser Source.
     *
     * Example:
     * Game 2: Win 1 | Lose 0 | Previous Game 1 Time 0:00 - 18:00
     */
    private getSourcesText(format?:string):string {

        const game:number = this.wins + this.loss + 1;

        return `Game ${game}: Win ${this.wins} | Lose ${this.loss}\nPrevious Game : ${this.previousGameStartTime} - ${this.previousGameEndTime}`;
    }


    private getShortLastRecordText():string {

        if(this.lastRecord) {

            return this.lastRecord
                .replace(TEXT_WIN_RATE, TEXT_WIN_RATE_SHORT)
                .replace(TEXT_WIN, TEXT_WIN_SHORT)
                .replace(TEXT_LOSS, TEXT_LOSS_SHORT);
        }

        return "";
    }


    private resetAllRecords():void {

        // Start a completely new Game 1
        this.gameStartTime = Date.now();

        this.previousGameStartTime = "0:00";
        this.previousGameEndTime = "0:00";

        this.setLSValue(
            "gameStartTime",
            this.gameStartTime.toString()
        );

        this.setLSValue(
            "previousGameStartTime",
            "0:00"
        );

        this.setLSValue(
            "previousGameEndTime",
            "0:00"
        );

        this.setRecords(0, 0);

        this.saveRecords();
    }


    private setRecords(
        wins?:number,
        loss?:number
    ):void {

        if(wins !== undefined) {
            this.wins = wins;
        }

        if(loss !== undefined) {
            this.loss = loss;
        }

        this.lastRecord = this.getLastRecordText();

        this.elInputWins?.setValue(this.wins);
        this.elInputLoss?.setValue(this.loss);

        if(this.elLastRecord) {
            this.elLastRecord.innerText =
                this.getShortLastRecordText();
        }

        this.setWinRateValue();
    }


    private saveRecords():void {

        this.setLSValue(
            "wins",
            this.wins.toString()
        );

        this.setLSValue(
            "loss",
            this.loss.toString()
        );

        this.setLSValue(
            "lastRecord",
            this.getLastRecordText()
        );

        this.setLSValue(
            "gameStartTime",
            this.gameStartTime.toString()
        );

        this.setLSValue(
            "previousGameStartTime",
            this.previousGameStartTime
        );

        this.setLSValue(
            "previousGameEndTime",
            this.previousGameEndTime
        );

        this.setRecords();
    }


    private getWinRateValue():string {

        const result:number =
            this.wins
                ? (this.wins / (this.wins + this.loss) * 100)
                : 0;

        return result.toFixed(2) + "%";
    }


    private getLastRecordText():string {

        return `${this.getSourcesText()} \n ${this.getDateText()}`;
    }


    private getDateText():string {

        const date:Date = new Date();

        return `${date.toLocaleDateString(this.locale)} (${date.toLocaleTimeString(this.locale)})`;
    }


    private getLocale():string {

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
    private formatGameTime(timestamp:number):string {

        const date:Date = new Date(timestamp);

        const hours:number = date.getHours();
        const minutes:number = date.getMinutes();
        const seconds:number = date.getSeconds();

        const minutesText:string =
            minutes < 10
                ? `0${minutes}`
                : minutes.toString();

        const secondsText:string =
            seconds < 10
                ? `0${seconds}`
                : seconds.toString();

        if(hours > 0) {
            return `${hours}:${minutesText}:${secondsText}`;
        }

        return `${minutes}:${secondsText}`;
    }


    private readValues():void {

        const lsWins:string | null =
            this.getLSValue("wins");

        const lsLoss:string | null =
            this.getLSValue("loss");

        const lsLastRecord:string | null =
            this.getLSValue("lastRecord");

        const lsGameStartTime:string | null =
            this.getLSValue("gameStartTime");

        const lsPreviousGameStartTime:string | null =
            this.getLSValue("previousGameStartTime");

        const lsPreviousGameEndTime:string | null =
            this.getLSValue("previousGameEndTime");


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
        if(lsGameStartTime) {

            this.gameStartTime =
                parseInt(lsGameStartTime);

        } else {

            this.gameStartTime = Date.now();

            this.setLSValue(
                "gameStartTime",
                this.gameStartTime.toString()
            );
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


    private getLSValue(
        key:string
    ):string | null {

        return window.localStorage.getItem(key);
    }


    private setLSValue(
        key:string,
        value:string
    ):void {

        window.localStorage.setItem(
            key,
            value
        );
    }


    private onInputChange(
        input:InputWinLoss | undefined,
        field:string
    ):void {

        if(!input) {
            return;
        }


        const newValue:number =
            input.getValue();


        /*
         * Make sure there is a starting timestamp.
         */
        if(this.gameStartTime === 0) {

            this.gameStartTime = Date.now();
        }


        /*
         * This is the moment the current game ends.
         */
        const currentTime:number = Date.now();


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
        if(field === "wins") {

            this.wins = newValue;

        } else {

            this.loss = newValue;
        }


        this.setWinRateValue();


        /*
         * Save the timing information so
         * the OBS Browser Source can see it.
         */
        this.setLSValue(
            "gameStartTime",
            this.gameStartTime.toString()
        );

        this.setLSValue(
            "previousGameStartTime",
            this.previousGameStartTime
        );

        this.setLSValue(
            "previousGameEndTime",
            this.previousGameEndTime
        );


        /*
         * Automatically save if the setting
         * is enabled.
         */
        if(!this.config.getUseSaveBtnValue()) {

            this.saveRecords();
        }
    }


    private setWinRateValue():void {

        if(this.elValueWinRate) {

            this.elValueWinRate.innerText =
                this.getWinRateValue();
        }
    }


    private openSettings():void {

        window.open(
            `${window.location.href}#settings`,
            "_blank",
            "width=640,height=480"
        );
    }
}


new Main();