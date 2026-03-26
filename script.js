const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const slots = ["8-9","9-10","10-11","11-12"];

let subjectsData = {};
let facultySchedule = {};
let roomSchedule = {};

const rooms = {
    theory: ["C1","C2","C3","C4","C5"],
    lab: ["L1","L2","L3"]
};

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
        type: type,
        frequency: frequency,
        priority: priority,
        faculty: faculty,
        availableDays: daysChecked
    });

    alert("Saved!");
}

function generateTimetable() {

    facultySchedule = {};
    roomSchedule = {};

    let className = document.getElementById("classSelect").value;
    let subjects = subjectsData[className];

    if (!subjects) return alert("Add subjects!");

    subjects.sort((a,b)=> b.priority - a.priority);

    let timetable = {};

    days.forEach(day=>{
        timetable[day]={};
        slots.forEach(slot=>{
            timetable[day][slot]=null;
        });
    });

    allocateLabs(subjects,timetable);
    allocateTheory(subjects,timetable);

    displayTimetable(timetable,className);
}

function allocateLabs(subjects,timetable){

    let labs = subjects.filter(s=>s.type==="Lab");

    labs.forEach(lab=>{
        for(let day of shuffle([...lab.availableDays])){
            for(let i=0;i<slots.length-1;i++){

                let s1=slots[i], s2=slots[i+1];

                let room=getFreeRoom("Lab",day,s1);

                if(room &&
                   !timetable[day][s1] &&
                   !timetable[day][s2] &&
                   isFacultyFree(lab.faculty,day,s1) &&
                   isFacultyFree(lab.faculty,day,s2)){

                    timetable[day][s1]={...lab,room};
                    timetable[day][s2]={...lab,room};

                    markFacultyBusy(lab.faculty,day,s1);
                    markFacultyBusy(lab.faculty,day,s2);

                    roomSchedule[room][day][s1]=true;
                    roomSchedule[room][day][s2]=true;

                    return;
                }
            }
        }
    });
}

function allocateTheory(subjects,timetable){

    let theory = subjects.filter(s=>s.type==="Theory");

    for(let sub of theory){

        let count=0;

        while(count<sub.frequency){

            let placed=false;

            for(let day of shuffle([...sub.availableDays])){

                for(let slot of shuffle([...slots])){

                    let room=getFreeRoom("Theory",day,slot);

                    if(room &&
                       !timetable[day][slot] &&
                       isFacultyFree(sub.faculty,day,slot) &&
                       !isAdjacentSame(day,slot,sub,timetable)){

                        timetable[day][slot]={...sub,room};

                        markFacultyBusy(sub.faculty,day,slot);
                        roomSchedule[room][day][slot]=true;

                        count++;
                        placed=true;
                        break;
                    }
                }
                if(placed) break;
            }

            if(!placed) break;
        }
    }
}

function getFreeRoom(type,day,slot){

    let list = type==="Lab"?rooms.lab:rooms.theory;

    for(let room of list){

        if(!roomSchedule[room]) roomSchedule[room]={};
        if(!roomSchedule[room][day]) roomSchedule[room][day]={};

        if(!roomSchedule[room][day][slot]){
            return room;
        }
    }
    return null;
}

function isFacultyFree(faculty,day,slot){

    if(!facultySchedule[faculty]) facultySchedule[faculty]={};
    if(!facultySchedule[faculty][day]) facultySchedule[faculty][day]={};

    return !facultySchedule[faculty][day][slot];
}

function markFacultyBusy(faculty,day,slot){

    if(!facultySchedule[faculty]) facultySchedule[faculty]={};
    if(!facultySchedule[faculty][day]) facultySchedule[faculty][day]={};

    facultySchedule[faculty][day][slot]=true;
}

function isAdjacentSame(day,slot,sub,timetable){

    let i=slots.indexOf(slot);

    if(i>0){
        let prev=slots[i-1];
        if(timetable[day][prev] && timetable[day][prev].name===sub.name)
            return true;
    }

    if(i<slots.length-1){
        let next=slots[i+1];
        if(timetable[day][next] && timetable[day][next].name===sub.name)
            return true;
    }

    return false;
}

function displayTimetable(timetable,className){

    let html="<table><tr><th>Day</th>";

    slots.forEach(s=>html+=`<th>${s}</th>`);
    html+="</tr>";

    days.forEach(day=>{
        html+=`<tr><td>${day}</td>`;
        slots.forEach(slot=>{
            let c=timetable[day][slot];
            if(c){
                html+=`<td class="${c.type==="Lab"?"lab":"theory"}">
                <b>${c.name}</b><br>${c.faculty}<br>${c.room}
                </td>`;
            } else html+="<td>-</td>";
        });
        html+="</tr>";
    });

    html+="</table>";

    document.getElementById("timetableTitle").innerText=className+" Timetable";
    document.getElementById("timetableContainer").innerHTML=html;
}

function shuffle(arr){
    return arr.sort(()=>Math.random()-0.5);
}





























// const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// const slots = ["8-9", "9-10", "10-11", "11-12"];

// let subjectsData = {};
// let facultySchedule = {}; // GLOBAL faculty tracking

// function addSubject() {
//     document.getElementById("subjectForm").style.display = "block";
// }

// function saveSubject() {

//     let className = document.getElementById("classSelect").value;

//     if (!subjectsData[className]) {
//         subjectsData[className] = [];
//     }

//     let subName = document.getElementById("subName").value;
//     let type = document.getElementById("subType").value;
//     let frequency = parseInt(document.getElementById("frequency").value);
//     let faculty = document.getElementById("faculty").value;

//     let checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
//     let availableDays = Array.from(checkboxes).map(cb => cb.value);

//     subjectsData[className].push({
//         name: subName,
//         type: type,
//         frequency: frequency,
//         faculty: faculty,
//         availableDays: availableDays
//     });

//     alert("Subject Saved!");
// }

// function generateTimetable() {

//     let className = document.getElementById("classSelect").value;
//     let subjects = subjectsData[className];

//     if (!subjects) {
//         alert("Add subjects first!");
//         return;
//     }

//     let timetable = {};

//     days.forEach(day => {
//         timetable[day] = {};
//         slots.forEach(slot => {
//             timetable[day][slot] = null;
//         });
//     });

//     allocateLabs(subjects, timetable, className);
//     allocateTheory(subjects, timetable, className);

//     displayTimetable(timetable, className);
// }

// function allocateLabs(subjects, timetable, className) {

//     let labs = subjects.filter(s => s.type === "Lab");

//     labs.forEach(lab => {

//         let shuffledDays = shuffle([...lab.availableDays]);

//         for (let day of shuffledDays) {

//             for (let i = 0; i < slots.length - 1; i++) {

//                 let slot1 = slots[i];
//                 let slot2 = slots[i + 1];

//                 if (!timetable[day][slot1] &&
//                     !timetable[day][slot2] &&
//                     isFacultyFree(lab.faculty, day, slot1) &&
//                     isFacultyFree(lab.faculty, day, slot2)) {

//                     timetable[day][slot1] = lab;
//                     timetable[day][slot2] = lab;

//                     markFacultyBusy(lab.faculty, day, slot1);
//                     markFacultyBusy(lab.faculty, day, slot2);

//                     return;
//                 }
//             }
//         }
//     });
// }

// function allocateTheory(subjects, timetable, className) {

//     let theory = subjects.filter(s => s.type === "Theory");

//     for (let sub of theory) {

//         let count = 0;
//         let shuffledDays = shuffle([...sub.availableDays]);

//         while (count < sub.frequency) {

//             let placed = false;

//             for (let day of shuffledDays) {

//                 if (count >= sub.frequency) break;

//                 let shuffledSlots = shuffle([...slots]);

//                 for (let slot of shuffledSlots) {

//                     if (!timetable[day][slot] &&
//                         isFacultyFree(sub.faculty, day, slot) &&
//                         !isAdjacentSame(day, slot, sub, timetable)) {

//                         timetable[day][slot] = sub;
//                         markFacultyBusy(sub.faculty, day, slot);
//                         count++;
//                         placed = true;
//                         break;
//                     }
//                 }
//             }

//             if (!placed) break; // stop if no possible placement
//         }
//     }
// }

// function isAdjacentSame(day, slot, subject, timetable) {

//     let index = slots.indexOf(slot);

//     if (index > 0) {
//         let prev = slots[index - 1];
//         if (timetable[day][prev] &&
//             timetable[day][prev].name === subject.name)
//             return true;
//     }

//     if (index < slots.length - 1) {
//         let next = slots[index + 1];
//         if (timetable[day][next] &&
//             timetable[day][next].name === subject.name)
//             return true;
//     }

//     return false;
// }

// function isFacultyFree(faculty, day, slot) {

//     if (!facultySchedule[faculty]) {
//         facultySchedule[faculty] = {};
//     }

//     if (!facultySchedule[faculty][day]) {
//         facultySchedule[faculty][day] = {};
//     }

//     return !facultySchedule[faculty][day][slot];
// }

// function markFacultyBusy(faculty, day, slot) {

//     if (!facultySchedule[faculty]) {
//         facultySchedule[faculty] = {};
//     }

//     if (!facultySchedule[faculty][day]) {
//         facultySchedule[faculty][day] = {};
//     }

//     facultySchedule[faculty][day][slot] = true;
// }

// function displayTimetable(timetable, className) {

//     let html = "<table><tr><th>Day</th>";

//     slots.forEach(slot => {
//         html += "<th>" + slot + "</th>";
//     });

//     html += "</tr>";

//     days.forEach(day => {

//         html += "<tr><td>" + day + "</td>";

//         slots.forEach(slot => {

//             let cell = timetable[day][slot];

//             if (cell) {
//                 html += `<td class="${cell.type === "Lab" ? "lab" : "theory"}">
//                             ${cell.name}<br>
//                             ${cell.faculty}
//                          </td>`;
//             } else {
//                 html += "<td>-</td>";
//             }
//         });

//         html += "</tr>";
//     });

//     html += "</table>";

//     document.getElementById("timetableTitle").innerText =
//         className + " Timetable";

//     document.getElementById("timetableContainer").innerHTML = html;
// }

// function shuffle(array) {
//     return array.sort(() => Math.random() - 0.5);
// }
