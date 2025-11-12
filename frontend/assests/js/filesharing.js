const files=[
  {name:"Project_Plan.pdf",type:"PDF",size:"1.2 MB",user:"Maria",date:"2025-10-10"},
  {name:"UI_Design.fig",type:"Figma",size:"4.5 MB",user:"Joshi",date:"2025-10-12"},
  {name:"Meeting_Notes.docx",type:"DOCX",size:"340 KB",user:"Ankit",date:"2025-10-14"},
];

const table=document.getElementById("fileTable");

function renderFiles(){
    table.innerHTML="";
    const term=document.getElementById("searchInput").value.toLowerCase();
    files.filter(f=>f.name.toLowerCase().includes(term)).forEach((f,i)=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${f.name}</td>
            <td>${f.type}</td>
            <td>${f.size}</td>
            <td>${f.user}</td>
            <td>${f.date}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-success me-1"><i class="fa-solid fa-download"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFile(${i})"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        table.appendChild(row);
    });
}

function deleteFile(i){ files.splice(i,1); renderFiles(); }

document.getElementById("uploadForm").addEventListener("submit", e=>{
    e.preventDefault();
    const title=fileTitle.value.trim();
    const file=fileUpload.files[0];
    if(!file) return;
    const size=(file.size/1024/1024).toFixed(1)+" MB";
    const type=file.name.split('.').pop().toUpperCase();
    files.push({name:title||file.name,type,size,user:"You",date:new Date().toISOString().split('T')[0]});
    renderFiles();
    e.target.reset();
    bootstrap.Modal.getInstance(document.getElementById("uploadModal")).hide();
});

// Drag & Drop
const dropArea=document.getElementById("dropArea");
dropArea.addEventListener("click",()=>document.getElementById("fileInput").click());
dropArea.addEventListener("dragover", e=>{ e.preventDefault(); dropArea.classList.add("dragover"); });
dropArea.addEventListener("dragleave", ()=>dropArea.classList.remove("dragover"));
dropArea.addEventListener("drop", e=>{
    e.preventDefault();
    dropArea.classList.remove("dragover");
    for(let file of e.dataTransfer.files){
        const size=(file.size/1024/1024).toFixed(1)+" MB";
        const type=file.name.split('.').pop().toUpperCase();
        files.push({name:file.name,type,size,user:"You",date:new Date().toISOString().split('T')[0]});
    }
    renderFiles();
});

document.getElementById("fileInput").addEventListener("change", e=>{
    for(let file of e.target.files){
        const size=(file.size/1024/1024).toFixed(1)+" MB";
        const type=file.name.split('.').pop().toUpperCase();
        files.push({name:file.name,type,size,user:"You",date:new Date().toISOString().split('T')[0]});
    }
    renderFiles();
});

document.getElementById("searchInput").addEventListener("input", renderFiles);
renderFiles();

document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});