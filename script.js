const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const slots = ["8-9","9-10","10-11","11-12"];

let subjectsData = {};
let facultySchedule = {};
let roomSchedule = {};
let allTimetables = {};

const rooms = {
    theory: ["C1","C2","C3","C4","C5"],
    lab: ["L1","L2","L3"]
};

// ------------------ MAX HEAP ------------------
class MaxHeap {
    constructor() {
        this.heap = [];
    }

    insert(item) {
        this.heap.push(item);
        this.bubbleUp();
    }

    bubbleUp() {
        let i = this.heap.length - 1;
        while (i > 0) {
            let p = Math.floor((i - 1) / 2);
            if (this.heap[p].priority >= this.heap[i].priority) break;
            [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
            i = p;
        }
    }

    extractMax() {
        if (this.heap.length === 1) return this.heap.pop();
        let max = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return max;
    }

    bubbleDown(i) {
        let left = 2*i+1, right = 2*i+2, largest = i;

        if (left < this.heap.length && this.heap[left].priority > this.heap[largest].priority)
            largest = left;

        if (right < this.heap.length && this.heap[right].priority > this.heap[largest].priority)
            largest = right;

        if (largest !== i) {
            [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
            this.bubbleDown(largest);
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

// ------------------ UI ------------------
function addSubject() {
    document.getElementById("subjectForm").style.display = "block";
}

function saveSubject() {
    let className = document.getElementById("classSelect").value;

    if (!subjectsData[className]) {
        subjectsData[className] = [];
    }

    let subName = document.getElementById("subName").value;
    let type = document.getElementById("subType").value;
    let frequency = parseInt(document.getElementById("frequency").value);
    let priority = parseInt(document.getElementById("priority").value);
    let faculty = document.getElementById("faculty").value;

    let daysChecked = Array.from(
        document.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => cb.value);

    subjectsData[className].push({
        name: subName,
        type,
        frequency,
        priority,
        faculty,
        availableDays: daysChecked
    });

    alert("Saved!");
}

// ------------------ MAIN GENERATION ------------------
function generateTimetable() {

    let className = document.getElementById("classSelect").value;
    let subjects = subjectsData[className];

    if (!subjects) return alert("Add subjects!");

    let bestTimetable = null;
    let bestScore = -1;
    let bestUnscheduled = [];

    for (let attempt = 0; attempt < 30; attempt++) {

        facultySchedule = {};
        roomSchedule = {};

        let timetable = initializeTable();

        let heap = new MaxHeap();
        subjects.forEach(s => heap.insert({...s}));

        let unscheduled = [];

        while (!heap.isEmpty()) {
            let sub = heap.extractMax();
            let count = 0;

            while (count < sub.frequency) {
                let placed = tryPlace(sub, timetable);

                if (placed) count++;
                else break;
            }

            if (count < sub.frequency) {
                unscheduled.push(sub.name);
            }
        }

        let score = calculateFitness(timetable, unscheduled);

        if (score > bestScore) {
            bestScore = score;
            bestTimetable = timetable;
            bestUnscheduled = unscheduled;
        }
    }

    allTimetables[className] = {
        table: bestTimetable,
        unscheduled: bestUnscheduled
    };

    displayAllTimetables();
}

// ------------------ HELPERS ------------------
function initializeTable() {
    let table = {};
    days.forEach(day => {
        table[day] = {};
        slots.forEach(slot => {
            table[day][slot] = null;
        });
    });
    return table;
}

function tryPlace(sub, timetable) {

    for (let day of shuffle([...sub.availableDays])) {

        if (sub.type === "Lab") {

            for (let i = 0; i < slots.length - 1; i++) {

                let s1 = slots[i], s2 = slots[i+1];
                let room = getFreeRoom("Lab", day, s1);

                if (room &&
                    !timetable[day][s1] &&
                    !timetable[day][s2] &&
                    isFacultyFree(sub.faculty, day, s1) &&
                    isFacultyFree(sub.faculty, day, s2)) {

                    timetable[day][s1] = {...sub, room};
                    timetable[day][s2] = {...sub, room};

                    markBusy(sub.faculty, room, day, s1);
                    markBusy(sub.faculty, room, day, s2);

                    return true;
                }
            }

        } else {

            for (let slot of shuffle([...slots])) {

                let room = getFreeRoom("Theory", day, slot);

                if (room &&
                    !timetable[day][slot] &&
                    isFacultyFree(sub.faculty, day, slot) &&
                    !isAdjacentSame(day, slot, sub, timetable)) {

                    timetable[day][slot] = {...sub, room};
                    markBusy(sub.faculty, room, day, slot);

                    return true;
                }
            }
        }
    }

    return false;
}

function calculateFitness(timetable, unscheduled) {

    let score = 100;

    score -= unscheduled.length * 10;

    days.forEach(day => {
        let prev = null;
        slots.forEach(slot => {
            let curr = timetable[day][slot];
            if (curr && prev && curr.name === prev.name) {
                score -= 5;
            }
            prev = curr;
        });
    });

    return score;
}

// ------------------ UTIL ------------------
function getFreeRoom(type, day, slot) {

    let list = type === "Lab" ? rooms.lab : rooms.theory;

    for (let room of list) {

        if (!roomSchedule[room]) roomSchedule[room] = {};
        if (!roomSchedule[room][day]) roomSchedule[room][day] = {};

        if (!roomSchedule[room][day][slot]) return room;
    }

    return null;
}

function isFacultyFree(faculty, day, slot) {

    if (!facultySchedule[faculty]) facultySchedule[faculty] = {};
    if (!facultySchedule[faculty][day]) facultySchedule[faculty][day] = {};

    return !facultySchedule[faculty][day][slot];
}

function markBusy(faculty, room, day, slot) {

    if (!facultySchedule[faculty]) facultySchedule[faculty] = {};
    if (!facultySchedule[faculty][day]) facultySchedule[faculty][day] = {};

    facultySchedule[faculty][day][slot] = true;

    if (!roomSchedule[room]) roomSchedule[room] = {};
    if (!roomSchedule[room][day]) roomSchedule[room][day] = {};

    roomSchedule[room][day][slot] = true;
}

function isAdjacentSame(day, slot, sub, timetable) {

    let i = slots.indexOf(slot);

    if (i > 0 && timetable[day][slots[i-1]]?.name === sub.name) return true;
    if (i < slots.length-1 && timetable[day][slots[i+1]]?.name === sub.name) return true;

    return false;
}

// Better shuffle
function shuffle(arr) {
    for (let i = arr.length-1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ------------------ DISPLAY ALL ------------------
function displayAllTimetables() {

    let html = "";

    for (let className in allTimetables) {

        let timetable = allTimetables[className].table;
        let unscheduled = allTimetables[className].unscheduled;

        html += `<h2>${className} Timetable</h2>`;
        html += "<table><tr><th>Day</th>";

        slots.forEach(s => html += `<th>${s}</th>`);
        html += "</tr>";

        days.forEach(day => {
            html += `<tr><td>${day}</td>`;
            slots.forEach(slot => {
                let c = timetable[day][slot];
                if (c) {
                    html += `<td class="${c.type==="Lab"?"lab":"theory"}">
                    <b>${c.name}</b><br>${c.faculty}<br>${c.room}
                    </td>`;
                } else html += "<td>-</td>";
            });
            html += "</tr>";
        });

        html += "</table>";

        if (unscheduled.length > 0) {
            html += `<p style="color:red;"><b>Unscheduled:</b> ${unscheduled.join(", ")}</p>`;
        }
    }

    document.getElementById("timetableContainer").innerHTML = html;
}

// ------------------ EXTRA LECTURE ------------------
function showFreeSlots() {

    let className = document.getElementById("extraClass").value;
    let faculty = document.getElementById("extraFaculty").value;

    let timetable = allTimetables[className]?.table;

    if (!timetable) return alert("Generate timetable first!");

    let html = "<h3>Free Slots:</h3>";

    days.forEach(day => {
        slots.forEach(slot => {

            let isClassFree = !timetable[day][slot];
            let isFacultyFreeSlot = isFacultyFreeExtra(faculty, day, slot);

            if (isClassFree && isFacultyFreeSlot) {
                html += `<button onclick="addExtraLecture('${className}','${faculty}','${day}','${slot}')">
                ${day} ${slot}
                </button><br>`;
            }
        });
    });

    document.getElementById("freeSlots").innerHTML = html;
}

function isFacultyFreeExtra(faculty, day, slot) {

    for (let cls in allTimetables) {

        let table = allTimetables[cls].table;

        if (table[day][slot] && table[day][slot].faculty === faculty) {
            return false;
        }
    }

    return true;
}

function addExtraLecture(className, faculty, day, slot) {

    let timetable = allTimetables[className].table;

    // ❌ Check if class already has lecture
    if (timetable[day][slot]) {
        alert("❌ Clash: Class already has a lecture at this time!");
        return;
    }

    // ❌ Check faculty clash across all classes
    for (let cls in allTimetables) {
        let table = allTimetables[cls].table;

        if (table[day][slot] && table[day][slot].faculty === faculty) {
            alert("❌ Clash: Faculty is already busy at this time!");
            return;
        }
    }

    let subject = prompt("Enter Subject Name:");
    if (!subject) return;

    // ✅ Safe to add
    timetable[day][slot] = {
        name: subject + " (Extra)",
        faculty: faculty,
        room: "Extra",
        type: "Theory"
    };

    alert("✅ Extra lecture added successfully!");

    displayAllTimetables();
}
