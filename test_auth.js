/**
 * Self-check for Jiya Financial Services Authentication & User Management Logic.
 * Verifies Admin login, Employee creation, Employee login, Admin Change Password,
 * and Employee password updates.
 */

function authenticate(store, username, password) {
  if (!username || !password) {
    return { success: false, error: "Username and password are required." };
  }
  const cleanUser = String(username).trim().toLowerCase();

  // Check Admin
  if (store.admin && store.admin.username.toLowerCase() === cleanUser) {
    if (store.admin.password === password) {
      return {
        success: true,
        user: { role: "admin", username: store.admin.username, name: store.admin.name || "Administrator" }
      };
    } else {
      return { success: false, error: "Invalid password for Admin." };
    }
  }

  // Check Employees
  if (Array.isArray(store.employees)) {
    const emp = store.employees.find(e => e.username.toLowerCase() === cleanUser);
    if (emp) {
      if (emp.status === "Inactive") {
        return { success: false, error: "This employee account is deactivated." };
      }
      if (emp.password === password) {
        return {
          success: true,
          user: { role: "employee", username: emp.username, name: emp.name, id: emp.id }
        };
      } else {
        return { success: false, error: "Invalid password for Employee." };
      }
    }
  }

  return { success: false, error: "User ID not found." };
}

function createEmployee(store, { name, username, password }) {
  if (!name || !name.trim()) {
    return { success: false, error: "Employee name is required." };
  }
  if (!username || !username.trim()) {
    return { success: false, error: "Employee User ID is required." };
  }
  if (!password || password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters long." };
  }

  const cleanUser = username.trim().toLowerCase();

  // Check collision with admin
  if (store.admin && store.admin.username.toLowerCase() === cleanUser) {
    return { success: false, error: "User ID already reserved for Admin." };
  }

  // Check collision with other employees
  if (store.employees.some(e => e.username.toLowerCase() === cleanUser)) {
    return { success: false, error: `User ID "${cleanUser}" already exists.` };
  }

  const newEmp = {
    id: "EMP" + Date.now(),
    name: name.trim(),
    username: cleanUser,
    password: password,
    status: "Active",
    createdAt: new Date().toISOString().split("T")[0]
  };

  store.employees.push(newEmp);
  return { success: true, employee: newEmp };
}

function changeAdminPassword(store, currentPassword, newPassword) {
  if (!store.admin) {
    return { success: false, error: "Admin account not initialized." };
  }
  if (store.admin.password !== currentPassword) {
    return { success: false, error: "Current password is incorrect." };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: "New password must be at least 4 characters long." };
  }
  store.admin.password = newPassword;
  return { success: true };
}

function resetEmployeePassword(store, employeeId, newPassword) {
  const emp = store.employees.find(e => e.id === employeeId);
  if (!emp) {
    return { success: false, error: "Employee not found." };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: "Password must be at least 4 characters long." };
  }
  emp.password = newPassword;
  return { success: true };
}

function deleteEmployee(store, employeeId) {
  const initLen = store.employees.length;
  store.employees = store.employees.filter(e => e.id !== employeeId);
  return { success: store.employees.length < initLen };
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testAuthSuite() {
  console.log("Running Authentication & User Management Tests...");

  const store = {
    admin: {
      username: "admin",
      password: "admin123",
      name: "Administrator"
    },
    employees: [
      { id: "E1", username: "emp1", password: "password123", name: "Pooja Sharma", status: "Active" }
    ]
  };

  // Test 1: Admin login success
  const adminAuth = authenticate(store, "admin", "admin123");
  assert(adminAuth.success === true, "Admin login success");
  assert(adminAuth.user.role === "admin", "Admin role correct");

  // Test 2: Admin wrong password
  const adminFail = authenticate(store, "admin", "wrongpass");
  assert(adminFail.success === false, "Admin login with wrong password rejected");

  // Test 3: Employee login success
  const empAuth = authenticate(store, "emp1", "password123");
  assert(empAuth.success === true, "Employee login success");
  assert(empAuth.user.role === "employee", "Employee role correct");
  assert(empAuth.user.name === "Pooja Sharma", "Employee name correct");

  // Test 4: Create new employee
  const createRes = createEmployee(store, { name: "Rahul Verma", username: "rahul101", password: "rahulpass" });
  assert(createRes.success === true, "Employee created successfully");
  assert(store.employees.length === 2, "Employee count updated to 2");

  // Test 5: Login with newly created employee
  const newEmpAuth = authenticate(store, "rahul101", "rahulpass");
  assert(newEmpAuth.success === true, "New employee can log in");
  assert(newEmpAuth.user.username === "rahul101", "New employee username matches");

  // Test 6: Duplicate username rejection
  const dupRes = createEmployee(store, { name: "Duplicate Rahul", username: "rahul101", password: "somepass" });
  assert(dupRes.success === false, "Duplicate username rejected");

  // Test 7: Admin Change Password
  const changePassFail = changeAdminPassword(store, "wrongOld", "newSecret2026");
  assert(changePassFail.success === false, "Admin password change with wrong old pass rejected");

  const changePassOk = changeAdminPassword(store, "admin123", "newSecret2026");
  assert(changePassOk.success === true, "Admin password changed successfully");
  assert(store.admin.password === "newSecret2026", "Admin password updated in store");

  // Old password no longer works
  const oldLogin = authenticate(store, "admin", "admin123");
  assert(oldLogin.success === false, "Old admin password no longer works");

  // New password works
  const newLogin = authenticate(store, "admin", "newSecret2026");
  assert(newLogin.success === true, "New admin password logs in");

  // Test 8: Reset Employee Password
  const resetRes = resetEmployeePassword(store, "E1", "newEmpPass99");
  assert(resetRes.success === true, "Employee password reset");
  const empNewLogin = authenticate(store, "emp1", "newEmpPass99");
  assert(empNewLogin.success === true, "Employee logs in with new password");

  // Test 9: Delete employee
  const delRes = deleteEmployee(store, "E1");
  assert(delRes.success === true, "Employee deleted");
  assert(store.employees.length === 1, "Employee list length reduced");
  const delLogin = authenticate(store, "emp1", "newEmpPass99");
  assert(delLogin.success === false, "Deleted employee cannot log in");

  console.log("✅ All Auth & User Management tests passed!");
}

if (typeof module !== "undefined" && require.main === module) {
  testAuthSuite();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    authenticate,
    createEmployee,
    changeAdminPassword,
    resetEmployeePassword,
    deleteEmployee,
    testAuthSuite
  };
}
