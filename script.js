var PrettyJSON = {
  print: function (elementId, json) {
    document.getElementById(elementId).innerHTML = PrettyJSON.prettyPrint(json);
  },
  replacer: function (match, pIndent, pKey, pVal, pEnd) {
    var key = "<span class=json-key>";
    var val = "<span class=json-value>";
    var str = "<span class=json-string>";
    var r = pIndent || "";
    if (pKey) r = r + key + pKey.replace(/[": ]/g, "") + "</span>: ";
    if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + "</span>";
    return r + (pEnd || "");
  },
  prettyPrint: function (obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
    return JSON.stringify(obj, null, 3)
      .replace(/&/g, "&amp;")
      .replace(/\\"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(jsonLine, PrettyJSON.replacer);
  },
};

const progessStep1 = document.getElementById("progress-step-1");
const progessStep2 = document.getElementById("progress-step-2");
const progessStep3 = document.getElementById("progress-step-3");
const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");
const step3 = document.getElementById("step-3");
const step4 = document.getElementById("step-4");
const errors = document.getElementById("errors");

const setProgressCurrent = (processElement) => {
  processElement.classList.add("current");
};
const setProgressComplete = (processElement) => {
  processElement.classList.remove("current");
  processElement.classList.add("complete");
};
const setStepCurrent = (stepElement) => {
  errors.innerHTML = "";
  step1.style.display = "none";
  step2.style.display = "none";
  step3.style.display = "none";
  step4.style.display = "none";
  stepElement.style.display = "inherit";
};
const showError = (message) => {
  var paragraph = document.createElement("p");
  paragraph.textContent = message;
  errors.append(paragraph);
};

setProgressCurrent(progessStep1);
setStepCurrent(step1);
Formio.createForm(document.getElementById("copyform"), {
  components: [
    {
      type: "textfield",
      label: "Source Form",
      key: "source",
      input: true,
      inputType: "text",
      defaultValue: "https://examples.form.io/example",
      validate: {
        required: true,
        pattern:
          "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$",
        customMessage: "Source form must be a valid url",
      },
    },
    {
      type: "textfield",
      label: "Destination Project",
      key: "dest",
      input: true,
      inputType: "text",
      placeholder: "https://yourproject.form.io",
      validate: {
        required: true,
        pattern:
          "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$",
        customMessage: "Destination project must be a valid url",
      },
    },
    {
      type: "button",
      action: "submit",
      theme: "primary",
      label: "Submit",
    },
  ],
}).then(function (form) {
  form.on("submit", function (baseSubmission) {
    // Load the existing form
    Formio.setToken(null);
    Formio.setBaseUrl(baseSubmission.data.dest);
    new Formio(baseSubmission.data.source)
      .loadForm()
      .then(function (src) {
        setProgressComplete(progessStep1);
        setProgressCurrent(progessStep2);
        setStepCurrent(step2);

        Formio.createForm(
          document.getElementById("loginform"),
          baseSubmission.data.dest + "/user/login"
        ).then(function (loginForm) {
          loginForm.on("submit", function () {
            setProgressComplete(progessStep2);
            setProgressCurrent(progessStep3);
            setStepCurrent(step3);

            Formio.createForm(document.getElementById("submitform"), {
              components: [
                {
                  type: "textfield",
                  label: "New form title",
                  key: "title",
                  input: true,
                  inputType: "text",
                  defaultValue: src.title + " - Copy",
                  validate: {
                    required: true,
                  },
                },
                {
                  type: "textfield",
                  label: "New form name",
                  key: "name",
                  input: true,
                  inputType: "text",
                  defaultValue: src.name + "-copy",
                  validate: {
                    required: true,
                  },
                },
                {
                  type: "textfield",
                  label: "New form path",
                  key: "path",
                  input: true,
                  inputType: "text",
                  defaultValue: src.path + "-copy",
                  validate: {
                    required: true,
                  },
                },
                {
                  type: "button",
                  action: "submit",
                  theme: "primary",
                  label: "Submit",
                },
              ],
            }).then(function (form) {
              form.on("submit", function (submission) {
                new Formio(baseSubmission.data.dest)
                  .saveForm({
                    title: submission.data.title,
                    display: src.display,
                    name: submission.data.name,
                    path: submission.data.path,
                    type: src.type,
                    tags: src.tags,
                    components: src.components,
                  })
                  .then(
                    function (copy) {
                      setProgressComplete(progessStep3);
                      setStepCurrent(step4);

                      PrettyJSON.print("json-result", copy);
                    },
                    function (err) {
                      setProgressComplete(progessStep3);
                      setStepCurrent(step4);

                      PrettyJSON.print("json-result", err);
                    }
                  );
              });
            });
          });
        });
      })
      .catch((e) => {
        showError(e);
      });
  });
});
