const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const slots = ["8-9","9-10","10-11","11-12","12-1","1-2","2-3","3-4","4-5","5-6"];

let subjectsData = {};
let facultySchedule = {};
let roomSchedule = {};
let allTimetables = {};

const rooms = {
    theory: ["C1","C2","C3","C4","C5"],
    lab: ["L1","L2","L3"]
};

// ─────────────────────────────────────────────
// EMAILJS CONFIG — fill these in after setup
// ─────────────────────────────────────────────
const EMAILJS_CONFIG = {
    publicKey:  "_uS8k5gShNGPtQyNF",       // from EmailJS dashboard → Account
    serviceId:  "service_k8u5ltw",       // from EmailJS dashboard → Email Services
    templateId: "template_pg2wle3"       // from EmailJS dashboard → Email Templates
};

// ─────────────────────────────────────────────
// CLASS → STUDENT EMAILS  (hardcoded)
// Add/remove emails for each class as needed
// ─────────────────────────────────────────────
const classEmails = {
    "FE-A": ["kaleayush2006@gmail.com", "arya.kale24@vit.edu", "Aayush.kalamkar24@vit.edu", "varsha.kanakdande24@vit.edu"],
    "FE-B": ["student1.feb@college.edu", "student2.feb@college.edu"],
    "FE-C": ["student1.fec@college.edu"],
    "FE-D": ["student1.fed@college.edu"],
    "FE-E": ["student1.fee@college.edu"],
    "SE-A": ["student1.sea@college.edu", "student2.sea@college.edu"],
    "SE-B": ["student1.seb@college.edu"],
    "SE-C": ["student1.sec@college.edu"],
    "SE-D": ["student1.sed@college.edu"],
    "SE-E": ["student1.see@college.edu"]
};

// ─────────────────────────────────────────────
// SEND NOTIFICATION via EmailJS
// ─────────────────────────────────────────────
async function sendClassNotification(className, faculty, subject, slot, date) {
    const emails = classEmails[className];
    if (!emails || emails.length === 0) {
        console.warn("No emails configured for class:", className);
        return;
    }

    // EmailJS free tier sends one email per call.
    // We send to each student individually so every inbox gets it.
    const sendPromises = emails.map(toEmail =>
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            to_email:     toEmail,
            class_name:   className,
            faculty_name: faculty,
            subject_name: subject,
            time_slot:    slot,
            date:         date,
            message:      `Dear Student,\n\nAn extra lecture has been scheduled for your class.\n\n📚 Subject: ${subject}\n👨‍🏫 Faculty: ${faculty}\n🕐 Time: ${slot}\n📅 Date: ${date}\n🏫 Class: ${className}\n\nPlease make note of this additional session.\n\nRegards,\nCollege Timetable System`
        })
    );

    try {
        await Promise.all(sendPromises);
        console.log(`✅ Notifications sent to ${emails.length} student(s) of ${className}`);
    } catch (err) {
        console.error("EmailJS error:", err);
        alert("⚠️ Lecture booked but email notification failed. Check EmailJS config in script.js.\nError: " + (err.text || err));
    }
}

// ─────────────────────────────────────────────
// FORMAT DATE  e.g. "Sunday, 03 May 2026"
// ─────────────────────────────────────────────
function getFormattedDate() {
    return new Date().toLocaleDateString("en-IN", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
}

// ------------------ MAX HEAP ------------------
class MaxHeap {
    constructor() { this.heap = []; }

    insert(item) { this.heap.push(item); this.bubbleUp(); }

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
        if (left < this.heap.length && this.heap[left].priority > this.heap[largest].priority) largest = left;
        if (right < this.heap.length && this.heap[right].priority > this.heap[largest].priority) largest = right;
        if (largest !== i) {
            [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
            this.bubbleDown(largest);
        }
    }

    isEmpty() { return this.heap.length === 0; }
}

// ------------------ UI ------------------
function addSubject() {
    document.getElementById("subjectForm").style.display = "block";
}

function saveSubject() {
    let className = document.getElementById("classSelect").value;
    if (!subjectsData[className]) subjectsData[className] = [];

    let subName     = document.getElementById("subName").value;
    let type        = document.getElementById("subType").value;
    let frequency   = parseInt(document.getElementById("frequency").value);
    let priority    = parseInt(document.getElementById("priority").value);
    let faculty     = document.getElementById("faculty").value;
    let daysChecked = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);

    subjectsData[className].push({ name: subName, type, frequency, priority, faculty, availableDays: daysChecked });
    alert("Saved!");
}

// ------------------ MAIN GENERATION ------------------
function generateTimetable() {
    let className = document.getElementById("classSelect").value;
    let subjects  = subjectsData[className];
    if (!subjects) return alert("Add subjects!");

    let bestTimetable = null, bestScore = -1, bestUnscheduled = [];

    for (let attempt = 0; attempt < 30; attempt++) {
        facultySchedule = {};
        roomSchedule    = {};
        let timetable   = initializeTable();
        let heap        = new MaxHeap();
        subjects.forEach(s => heap.insert({...s}));
        let unscheduled = [];

        while (!heap.isEmpty()) {
            let sub = heap.extractMax(), count = 0;
            while (count < sub.frequency) {
                if (tryPlace(sub, timetable)) count++;
                else break;
            }
            if (count < sub.frequency) unscheduled.push(sub.name);
        }

        let score = calculateFitness(timetable, unscheduled);
        if (score > bestScore) { bestScore = score; bestTimetable = timetable; bestUnscheduled = unscheduled; }
    }

    allTimetables[className] = { table: bestTimetable, unscheduled: bestUnscheduled };
    displayAllTimetables();
}

// ------------------ HELPERS ------------------
function initializeTable() {
    let table = {};
    days.forEach(day => { table[day] = {}; slots.forEach(slot => { table[day][slot] = null; }); });
    return table;
}

function tryPlace(sub, timetable) {
    for (let day of shuffle([...sub.availableDays])) {
        if (sub.type === "Lab") {
            for (let i = 0; i < slots.length - 1; i++) {
                let s1 = slots[i], s2 = slots[i+1];
                let room = getFreeRoom("Lab", day, s1);
                if (room && !timetable[day][s1] && !timetable[day][s2] &&
                    isFacultyFree(sub.faculty, day, s1) && isFacultyFree(sub.faculty, day, s2)) {
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
                if (room && !timetable[day][slot] && isFacultyFree(sub.faculty, day, slot) &&
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
            if (curr && prev && curr.name === prev.name) score -= 5;
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
        let timetable    = allTimetables[className].table;
        let unscheduled  = allTimetables[className].unscheduled;

        html += `<h2>${className} Timetable</h2><table><tr><th>Day</th>`;
        slots.forEach(s => html += `<th>${s}</th>`);
        html += "</tr>";

        days.forEach(day => {
            html += `<tr><td>${day}</td>`;
            slots.forEach(slot => {
                let c = timetable[day][slot];
                html += c
                    ? `<td class="${c.type==="Lab"?"lab":"theory"}"><b>${c.name}</b><br>${c.faculty}<br>${c.room}</td>`
                    : "<td>-</td>";
            });
            html += "</tr>";
        });

        html += "</table>";
        if (unscheduled.length > 0)
            html += `<p style="color:red;"><b>Unscheduled:</b> ${unscheduled.join(", ")}</p>`;
    }
    document.getElementById("timetableContainer").innerHTML = html;
}

// ------------------ EXTRA LECTURE (full week) ------------------
function showFreeSlots() {
    let className = document.getElementById("extraClass").value;
    let faculty   = document.getElementById("extraFaculty").value;
    let timetable = allTimetables[className]?.table;
    if (!timetable) return alert("Generate timetable first!");

    let html = "<h3>Free Slots (All Week):</h3>";
    days.forEach(day => {
        slots.forEach(slot => {
            if (!timetable[day][slot] && isFacultyFreeExtra(faculty, day, slot)) {
                html += `<button onclick="addExtraLecture('${className}','${faculty}','${day}','${slot}')">${day} ${slot}</button><br>`;
            }
        });
    });
    document.getElementById("freeSlots").innerHTML = html;
}

function isFacultyFreeExtra(faculty, day, slot) {
    for (let cls in allTimetables) {
        let table = allTimetables[cls].table;
        if (table[day][slot] && table[day][slot].faculty === faculty) return false;
    }
    return true;
}

async function addExtraLecture(className, faculty, day, slot) {
    let timetable = allTimetables[className].table;

    if (timetable[day][slot]) { alert("❌ Clash: Class already has a lecture at this time!"); return; }

    for (let cls in allTimetables) {
        let table = allTimetables[cls].table;
        if (table[day][slot] && table[day][slot].faculty === faculty) {
            alert("❌ Clash: Faculty is already busy at this time!"); return;
        }
    }

    let subject = prompt("Enter Subject Name:");
    if (!subject) return;

    timetable[day][slot] = { name: subject + " (Extra)", faculty, room: "Extra", type: "Theory" };
    markBusy(faculty, "Extra", day, slot);

    // Format date string for that day (find next occurrence)
    const targetDate = getNextDateForDay(day);

    alert("✅ Extra lecture added! Sending notifications...");
    displayAllTimetables();

    await sendClassNotification(className, faculty, subject, slot, targetDate);
}

// Returns "Monday, 04 May 2026" for the next occurrence of that weekday
function getNextDateForDay(dayName) {
    const targetIndex = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(dayName);
    const today = new Date();
    const diff  = (targetIndex - today.getDay() + 7) % 7;
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    return target.toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
}

// ------------------ TODAY'S TIMETABLE VIEW ------------------
function getTodayName() {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

function showTodayTimetable(className) {
    let container = document.getElementById("todayTimetableContainer");
    if (!allTimetables[className]) {
        container.innerHTML = `<p style="color:red;">⚠️ No timetable generated for <b>${className}</b>. Please generate it first.</p>`;
        return;
    }
    let today     = getTodayName();
    let timetable = allTimetables[className].table;

    if (!days.includes(today)) {
        container.innerHTML = `<p style="color:#888;">📅 Today is <b>${today}</b> — no classes scheduled (weekend).</p>`;
        return;
    }

    let html = `<h3>📅 ${className} — ${today}'s Schedule</h3>
    <table><tr><th>Slot</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Type</th></tr>`;

    slots.forEach(slot => {
        let c = timetable[today][slot];
        if (c) {
            html += `<tr class="${c.type==="Lab"?"lab":"theory"}">
                <td><b>${slot}</b></td><td>${c.name}</td><td>${c.faculty}</td><td>${c.room}</td><td>${c.type}</td>
            </tr>`;
        } else {
            html += `<tr><td><b>${slot}</b></td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
        }
    });

    html += "</table>";
    container.innerHTML = html;
}

function showTodayFreeSlots(className, faculty) {
    let container = document.getElementById("todayFreeSlots");
    if (!faculty || !faculty.trim()) { container.innerHTML = `<p style="color:red;">⚠️ Please enter a faculty name.</p>`; return; }
    if (!allTimetables[className]) { container.innerHTML = `<p style="color:red;">⚠️ No timetable for <b>${className}</b>. Generate first.</p>`; return; }

    let today = getTodayName();
    if (!days.includes(today)) { container.innerHTML = `<p style="color:#888;">📅 Today is <b>${today}</b> — no classes (weekend).</p>`; return; }

    let timetable      = allTimetables[className].table;
    let facultyTrimmed = faculty.trim();
    let freeSlots      = [];

    slots.forEach(slot => {
        let isClassFree = !timetable[today][slot];
        let facultyFree = true;
        for (let cls in allTimetables) {
            let t = allTimetables[cls].table;
            if (t[today] && t[today][slot] && t[today][slot].faculty === facultyTrimmed) { facultyFree = false; break; }
        }
        if (isClassFree && facultyFree && isFacultyFree(facultyTrimmed, today, slot)) freeSlots.push(slot);
    });

    if (freeSlots.length === 0) {
        container.innerHTML = `<p style="color:#888;">No free slots for <b>${facultyTrimmed}</b> in <b>${className}</b> today (${today}).</p>`;
        return;
    }

    let html = `<h3>🟢 Free Slots Today (${today}) for ${facultyTrimmed}</h3><p>Click a slot to book an extra lecture:</p>`;
    freeSlots.forEach(slot => {
        html += `<button onclick="bookExtraClassToday('${className}','${facultyTrimmed}','${slot}')">${slot}</button>`;
    });
    container.innerHTML = html;
}

async function bookExtraClassToday(className, faculty, slot) {
    if (!className || !faculty || !slot) { alert("❌ Invalid input: Please enter all details!"); return; }

    let today     = getTodayName();
    let timetable = allTimetables[className]?.table;
    if (!timetable) { alert("❌ Timetable not found for " + className); return; }

    if (timetable[today][slot]) { alert("❌ Clash: Class already has a lecture at this time!"); return; }

    for (let cls in allTimetables) {
        let t = allTimetables[cls].table;
        if (t[today] && t[today][slot] && t[today][slot].faculty === faculty) {
            alert("❌ Clash: Faculty is already busy at this time!"); return;
        }
    }

    if (!isFacultyFree(faculty, today, slot)) { alert("❌ Clash: Faculty is already busy at this time!"); return; }

    let subject = prompt("Enter Subject Name for Extra Lecture:");
    if (!subject || !subject.trim()) { alert("❌ Invalid input: Please enter all details!"); return; }

    // Book and persist
    timetable[today][slot] = { name: subject.trim() + " (Extra)", faculty, room: "Extra", type: "Theory" };
    markBusy(faculty, "Extra", today, slot);

    const dateStr = getFormattedDate();

    alert("✅ Extra lecture booked successfully for today! Sending notifications...");

    // Refresh displays
    showTodayTimetable(className);
    showTodayFreeSlots(className, faculty);
    displayAllTimetables();

    // Send email notifications to all students of this class
    await sendClassNotification(className, faculty, subject.trim(), slot, dateStr);
}
