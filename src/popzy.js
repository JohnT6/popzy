class Popzy {
    static element = [];

    constructor(options = {}) {
        if (!options.content && !options.templateId) {
            console.error(`Phải có "content" hoặc "templateId"`);
            return;
        }

        if (options.content && options.templateId) {
            options.templateId = null;
            console.warn(
                `Nếu có cả "content" và "templateId" thì "content" sẽ đc ưu tiên và "templateId" sẽ bị bỏ qua`,
            );
        }

        if (options.templateId) {
            this.template = document.querySelector(`#${options.templateId}`);

            if (!this.template) {
                console.error(`${options.templateId} không tồn tại`);
            }
        }

        this.opt = Object.assign(
            {
                enableScrollLock: true,
                closeMethods: ["button", "overlay", "escape"],
                destroyOnClose: true,
                cssClass: [],
                footer: false,
                scrollLockTarget: () => document.body,
            },
            options,
        );

        this.content = this.opt.content;

        this._allowButtonClose = this.opt.closeMethods.includes("button");
        this._allowBackdropClose = this.opt.closeMethods.includes("overlay");
        this._allowEscapeClose = this.opt.closeMethods.includes("escape");

        this._footerButtons = [];
    }

    _build() {
        const contentNode = this.content
            ? document.createElement("div")
            : this.template.content.cloneNode(true);

        if (this.content) {
            contentNode.innerHTML = this.content;
        }

        this._backdrop = document.createElement("div");
        this._backdrop.className = "popzy ";

        const container = document.createElement("div");
        container.className = "popzy__container";

        this.opt.cssClass.forEach((className) => {
            if (typeof className === "string") {
                container.classList.add(className);
            }
        });

        // Close Button
        if (this._allowButtonClose) {
            const btnClose = this._createButton("&times;", "popzy__close", () =>
                this.close(),
            );
            container.appendChild(btnClose);
        }

        this._modalContent = document.createElement("div");
        this._modalContent.className = "popzy__content";

        this._modalContent.append(contentNode);

        // append Element
        container.append(this._modalContent);

        if (this.opt.footer) {
            this._modalFooter = document.createElement("div");
            this._modalFooter.className = "popzy__footer";

            this._setFooterContents();

            this._renderFooterButtons();

            container.append(this._modalFooter);
        }

        this._backdrop.append(container);
        document.body.append(this._backdrop);
    }

    setContent(content) {
        this.content = content;

        if (this._modalContent) {
            this._modalContent.innerHTML = this.content;
        }
    }

    setFooterContent(content) {
        this._footerContent = content;

        this._setFooterContents();
    }

    _setFooterContents() {
        if (this._modalFooter && this._footerContent) {
            this._modalFooter.innerHTML = this._footerContent;
        }
    }

    addFooterButton(title, cssClass, callBack) {
        const button = this._createButton(title, cssClass, callBack);
        this._footerButtons.push(button);

        this._renderFooterButtons();
    }

    _renderFooterButtons() {
        if (this._modalFooter) {
            this._footerButtons.forEach((button) => {
                this._modalFooter.append(button);
            });
        }
    }

    _createButton(title, cssClass, callBack) {
        const button = document.createElement("button");
        button.className = cssClass;
        button.innerHTML = title;
        button.onclick = callBack;

        return button;
    }

    open() {
        Popzy.element.push(this);

        if (!this._backdrop) {
            this._build();
        }

        setTimeout(() => {
            this._backdrop.classList.add("popzy--show");
        }, 0);

        // Disable scroll
        if (Popzy.element.length === 1 && this.opt.enableScrollLock) {
            const target = this.opt.scrollLockTarget();

            if (this._hasScrollBar(target)) {
                target.classList.add("popzy--no-scroll");
                const targetPadRight = parseInt(
                    getComputedStyle(target).paddingRight,
                );

                target.style.paddingRight =
                    targetPadRight + this._getScrollbarWidth() + "px";
            }
        }

        // Overlay Close
        if (this._allowBackdropClose) {
            this._backdrop.onclick = (e) => {
                if (e.target === this._backdrop) {
                    this.close();
                }
            };
        }

        // Escape Close
        if (this._allowEscapeClose) {
            document.addEventListener("keydown", this._handleEscapeKey);
        }

        this._onTransitionEnd(this.opt.onOpen);
        return this._backdrop;
    }

    _onTransitionEnd(callBack) {
        this._backdrop.ontransitionend = (e) => {
            if (e.propertyName !== "transform") return;
            if (typeof callBack === "function") callBack();
        };
    }

    _handleEscapeKey = (e) => {
        const lastModal = Popzy.element[Popzy.element.length - 1];
        if (e.key === "Escape" && this === lastModal) {
            this.close();
        }
    };

    close(destroy = this.opt.destroyOnClose) {
        Popzy.element.pop();

        this._backdrop.classList.remove("popzy--show");

        document.removeEventListener("keydown", this._handleEscapeKey);

        this._onTransitionEnd(() => {
            if (this._backdrop && destroy) {
                this._backdrop.remove();
                this._backdrop = null;
                this._modalFooter = null;
            }

            if (this.opt.enableScrollLock && !Popzy.element.length) {
                const target = this.opt.scrollLockTarget();

                if (this._hasScrollBar(target)) {
                    target.classList.remove("popzy--no-scroll");
                    target.style.paddingRight = "";
                }
            }

            if (typeof this.opt.onClose === "function") this.opt.onClose();
        });
    }

    destroy() {
        this.close(true);
    }

    _hasScrollBar(target) {
        if ([document.documentElement, document.body].includes(target)) {
            return (
                document.documentElement.scrollHeight >
                    document.documentElement.clientHeight ||
                document.body.scrollHeight > document.body.clientHeight
            );
        }

        return target.scrollHeight > target.clientHeight;
    }

    _getScrollbarWidth() {
        if (this._scrollBarWidth) return this._scrollBarWidth;
        const div = document.createElement("div");
        Object.assign(div.style, {
            overflow: "scroll",
            position: "absolute",
            top: "-999999px",
        });

        document.body.appendChild(div);
        this._scrollBarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);

        return this._scrollBarWidth;
    }
}
