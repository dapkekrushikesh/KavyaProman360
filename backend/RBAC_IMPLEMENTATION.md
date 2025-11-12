# Role-Based Access Control (RBAC) Implementation

## ✅ Changes Applied

Your application now implements role-based filtering for projects and tasks.

## 🔐 Access Control Rules

### **Admin Role**
- ✅ Can see **ALL projects**
- ✅ Can see **ALL tasks**
- ✅ Full access to entire system

### **Project Manager Role**
- ✅ Can see **ALL projects**
- ✅ Can see **ALL tasks**
- ✅ Can manage all projects and tasks

### **Team Member Role** (or any other role)
- ⚠️ Can only see **projects they are assigned to** (where they are in the members list)
- ⚠️ Can only see **tasks assigned to them OR tasks in their projects**
- 🔒 Cannot see other users' projects or tasks

## 📝 What Was Changed

### 1. **Projects Route** (`backend/routes/projects.js`)

**Before:**
```javascript
router.get('/', auth, async (req, res) => {
  const projects = await Project.find().populate('members', 'email name');
  res.json(projects);
});
```

**After:**
```javascript
router.get('/', auth, async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;
  
  let projects;
  
  // Admin and Project Manager can see all projects
  if (userRole === 'Admin' || userRole === 'Project Manager') {
    projects = await Project.find().populate('members', 'email name role');
  } 
  // Team Members only see projects they're assigned to
  else {
    projects = await Project.find({ members: userId })
      .populate('members', 'email name role');
  }
  
  res.json(projects);
});
```

### 2. **Tasks Route** (`backend/routes/tasks.js`)

**Before:**
```javascript
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find()
    .populate('assignee', 'email name')
    .populate('project', 'title');
  res.json(tasks);
});
```

**After:**
```javascript
router.get('/', auth, async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;
  
  let query = {};
  
  // Team Members only see their tasks or tasks in their projects
  if (userRole !== 'Admin' && userRole !== 'Project Manager') {
    const userProjects = await Project.find({ members: userId });
    const projectIds = userProjects.map(p => p._id);
    
    query = {
      $or: [
        { assignee: userId },
        { project: { $in: projectIds } }
      ]
    };
  }
  
  const tasks = await Task.find(query)
    .populate('assignee', 'email name')
    .populate('project', 'title');
  res.json(tasks);
});
```

## 🧪 Testing the Changes

### Test Scenario 1: Admin User
1. Login as a user with role "Admin"
2. Navigate to Projects page
3. **Expected:** See ALL projects in the system

### Test Scenario 2: Project Manager
1. Login as a user with role "Project Manager"
2. Navigate to Projects page
3. **Expected:** See ALL projects in the system

### Test Scenario 3: Team Member
1. Login as a user with role "Team Member"
2. Navigate to Projects page
3. **Expected:** See ONLY projects where you are in the members list
4. Navigate to Tasks page
5. **Expected:** See ONLY tasks assigned to you OR tasks in your projects

## 📊 Database Requirements

### User Document Example:
```json
{
  "_id": "abc123",
  "email": "user@example.com",
  "password": "hashed_password",
  "role": "Team Member",  // Can be: "Admin", "Project Manager", "Team Member"
  "name": "John Doe"
}
```

### Project Document Example:
```json
{
  "_id": "proj123",
  "title": "Website Redesign",
  "members": ["userId1", "userId2", "userId3"],  // Array of user IDs
  "description": "Redesign company website"
}
```

## 🔄 How It Works

### For Projects:
1. User logs in → JWT token contains user ID
2. Backend extracts user info from token
3. Check user's role:
   - **Admin/PM:** Query `Project.find()` (all projects)
   - **Team Member:** Query `Project.find({ members: userId })` (only their projects)

### For Tasks:
1. User logs in → JWT token contains user ID
2. Backend extracts user info from token
3. Check user's role:
   - **Admin/PM:** Query `Task.find()` (all tasks)
   - **Team Member:** 
     - Find projects where they're a member
     - Query tasks where:
       - They are the assignee OR
       - Task belongs to one of their projects

## ⚙️ Role Assignment

Users get their role during registration (signup):
- Set in `backend/routes/auth.js`
- Stored in User model
- Available in all authenticated requests via `req.user.role`

## 🚀 Next Steps

1. **Restart your backend server** to apply changes
2. **Test with different user roles**
3. **Verify filtering works correctly**

## 🛡️ Security Benefits

✅ **Data Privacy:** Users can't access projects they're not part of
✅ **Role-Based Access:** Clear separation between Admin, PM, and Members
✅ **Backend Enforcement:** Security at API level, not just frontend
✅ **Scalable:** Easy to add more roles or permissions

---

**Your role-based access control is now active!** 🎉
