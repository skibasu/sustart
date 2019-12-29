import $ from "jquery";

const $html = $("html");
const $body = $("body");
let scrollTop;

class ScreenLock {
    constructor() {
        this.isLocked = false;
    }

    lock() {
        const $window = $(window);
        const windowHeight = window.innerHeight;
        scrollTop = $window.scrollTop();
        const overflow =
            $("html").prop("scrollHeight") > $(window).innerHeight()
                ? "scroll"
                : "";

        $html.css({
            width: "100%",
            height: windowHeight,
            overflowY: overflow,
            position: "fixed"
        });

        $body.css({
            height: `${windowHeight + scrollTop}px`,
            overflow: "hidden",
            marginTop: `-${scrollTop}px`
        });

        this.isLocked = true;
    }
    unlock() {
        const $window = $(window);

        $html.css({
            width: "",
            height: "",
            overflowY: "",
            position: "",
            overflow: ""
        });

        $body.css({
            height: "",
            overflowY: "",
            marginTop: "",
            position: "",
            overflow: ""
        });

        $window.scrollTop(scrollTop);

        this.isLocked = false;
    }
}

export default ScreenLock;
