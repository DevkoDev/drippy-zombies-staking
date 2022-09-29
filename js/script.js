function increase() {
    let value = document.getElementById("mintInput").value
    document.getElementById("mintInput").value = JSON.stringify(JSON.parse(value) + 1)
}

function decrease() {
    let value = document.getElementById("mintInput").value
    if (JSON.parse(value) > 0) {
    document.getElementById("mintInput").value = JSON.stringify(JSON.parse(value) - 1)
    }
}