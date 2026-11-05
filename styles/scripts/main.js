
console.log("FIXA JavaScript Loaded Successfully!");

const workspace = document.getElementById("workspace");
const toolTitle = document.getElementById("toolTitle");
const toolDescription = document.getElementById("toolDescription");
const filePicker = document.getElementById("filePicker");
const fileList = document.getElementById("fileList");
const processBtn = document.getElementById("processBtn");
const status = document.getElementById("status");

const tools = {
    merge: ["Merge PDF", ".pdf", true],
    split: ["Split PDF", ".pdf", false],
    compress: ["Compress PDF", ".pdf", false],
    repair: ["Repair PDF", ".pdf", false],
    ocr: ["OCR PDF", ".pdf", false],
    "jpg-to-pdf": ["JPG to PDF", "image/jpeg,image/png", true],
    "word-to-pdf": ["Word to PDF", ".doc,.docx", false],
    "ppt-to-pdf": ["PowerPoint to PDF", ".ppt,.pptx", false],
    "excel-to-pdf": ["Excel to PDF", ".xls,.xlsx", false],
    "html-to-pdf": ["HTML to PDF", ".html,.htm", false],
    "pdf-to-jpg": ["PDF to JPG", ".pdf", false],
    "pdf-to-word": ["PDF to Word", ".pdf", false],
    "pdf-to-ppt": ["PDF to PowerPoint", ".pdf", false],
    "pdf-to-excel": ["PDF to Excel", ".pdf", false],
    "pdf-to-pdfa": ["PDF to PDF/A", ".pdf", false],
    "remove-pages": ["Remove Pages", ".pdf", false],
    "extract-pages": ["Extract Pages", ".pdf", false],
    reorder: ["Reorder PDF", ".pdf", false],
    scan: ["Scan to PDF", "image/*", true],
    rotate: ["Rotate PDF", ".pdf", false],
    "add-page-numbers": ["Add Page Numbers", ".pdf", false],
    watermark: ["Add Watermark", ".pdf", false],
    "remove-watermark": ["Remove Watermark", ".pdf", false],
    crop: ["Crop PDF", ".pdf", false],
    "edit-directly": ["Edit PDF", ".pdf", false],
    unlock: ["Unlock PDF", ".pdf", false],
    protect: ["Protect PDF", ".pdf", false],
    sign: ["Sign PDF", ".pdf", false],
    redact: ["Redact PDF", ".pdf", false],
    compare: ["Compare PDFs", ".pdf", true]
};

let selectedTool = "";

window.openTool = function(tool) {

    if (!tools[tool]) {
        alert("Tool not found!");
        return;
    }

    selectedTool = tool;

    toolTitle.textContent = tools[tool][0];
    toolDescription.textContent = "Select your file to continue.";

    filePicker.accept = tools[tool][1];
    filePicker.multiple = tools[tool][2];

    filePicker.value = "";
    fileList.innerHTML = "";
    status.textContent = "";
    processBtn.hidden = true;

    workspace.hidden = false;

    workspace.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    filePicker.click();
};

filePicker.addEventListener("change", function() {

    const files = Array.from(filePicker.files);

    fileList.innerHTML = "";

    if (files.length === 0) {
        return;
    }

    files.forEach(file => {

        const item = document.createElement("p");

        item.textContent =
            "📄 " + file.name +
            " (" + (file.size / 1024 / 1024).toFixed(2) + " MB)";

        fileList.appendChild(item);
    });

    processBtn.hidden = false;

    status.textContent =
        files.length + " file(s) selected successfully!";
});



processBtn.addEventListener("click", async function () {

    const files = Array.from(filePicker.files);

    if (files.length === 0) {
        status.textContent = "Please select files first.";
        return;
    }

    processBtn.disabled = true;

    try {

        // JPG TO PDF
        if (selectedTool === "jpg-to-pdf") {

            if (!window.jspdf) {
                throw new Error("jsPDF library not loaded.");
            }

            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            for (let i = 0; i < files.length; i++) {

                const file = files[i];

                if (!["image/jpeg", "image/png"].includes(file.type)) {
                    throw new Error("Select JPG or PNG images only.");
                }

                const imageData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("Image reading failed."));
                    reader.readAsDataURL(file);
                });

                const image = new Image();

                await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = () => reject(new Error("Invalid image."));
                    image.src = imageData;
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;

                const scale = Math.min(
                    (pageWidth - margin * 2) / image.width,
                    (pageHeight - margin * 2) / image.height
                );

                const width = image.width * scale;
                const height = image.height * scale;

                if (i > 0) pdf.addPage();

                pdf.addImage(
                    imageData,
                    file.type === "image/png" ? "PNG" : "JPEG",
                    (pageWidth - width) / 2,
                    (pageHeight - height) / 2,
                    width,
                    height
                );
            }

            pdf.save("FIXA-Converted.pdf");

            status.textContent = "JPG to PDF completed successfully!";
        }

        // MERGE PDF
        else if (selectedTool === "merge") {

            if (!window.PDFLib) {
                throw new Error("PDF-lib library not loaded.");
            }

            if (files.length < 2) {
                throw new Error("Select at least two PDF files.");
            }

            const { PDFDocument } = window.PDFLib;

            const mergedPdf = await PDFDocument.create();

            for (const file of files) {

                if (file.type !== "application/pdf" &&
                    !file.name.toLowerCase().endsWith(".pdf")) {
                    throw new Error("Please select PDF files only.");
                }

                status.textContent = "Merging: " + file.name;

                const bytes = await file.arrayBuffer();

                const pdf = await PDFDocument.load(bytes);

                const pages = await mergedPdf.copyPages(
                    pdf,
                    pdf.getPageIndices()
                );

                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedBytes = await mergedPdf.save();

            const blob = new Blob([mergedBytes], {
                type: "application/pdf"
            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "FIXA-Merged.pdf";
            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 1000);

            status.textContent = "PDF files merged successfully!";
        }

        else {
            status.textContent =
                "This tool is coming soon: " + selectedTool;
        }

    } catch (error) {

        console.error(error);
        status.textContent = "Error: " + error.message;

    } finally {

        processBtn.disabled = false;

    }

});
