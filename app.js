// HCM Lite - Data stored in browser localStorage

const app = document.getElementById("app");

const read = key => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
};

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

function seedAdmin() {
  const users = read("users");

  if (!users.some(user => user.email === "admin@hcm.local")) {
    users.push({
      name: "HCM Admin",
      email: "admin@hcm.local",
      password: "Admin123!",
      role: "admin"
    });

    save("users", users);
  }
}

function today() {
  const d = new Date();

  return new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);
}

function header(title) {
  const user = getUser();

  return `
    <header class="topbar">
      <a class="brand" href="#" data-page="${
        user?.role === "admin" ? "admin" : "employee"
      }">
        HCM <span>Lite</span>
      </a>

      <div class="top-actions">
        <span>${esc(title || user?.name || "")}</span>
        <button class="outline" id="logoutBtn">Log out</button>
      </div>
    </header>
  `;
}

// LOGIN PAGE

function loginPage() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="logo">H</div>

        <p class="eyebrow">HUMAN CAPITAL MANAGEMENT</p>
        <h1>Welcome to HCM Lite</h1>
        <p class="muted">Sign in to manage your workplace.</p>

        <form id="loginForm">
          <label for="email">Email address</label>
          <input id="email" type="email"
            placeholder="admin@hcm.local" required>

          <label for="password">Password</label>
          <input id="password" type="password"
            placeholder="Enter password" required>

          <button class="primary" type="submit">Sign in</button>
          <p id="loginMessage" class="message"></p>
        </form>

        <aside class="demo">
          <b>Demo Admin Login</b>
          <span>Email: admin@hcm.local</span>
          <span>Password: Admin123!</span>
        </aside>

        <p><small>Demo only. Do not use real passwords.</small></p>
      </section>
    </main>
  `;

  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("email")
      .value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    const user = read("users").find(
      u => u.email.toLowerCase() === email &&
           u.password === password
    );

    if (!user) {
      document.getElementById("loginMessage").textContent =
        "Email or password is incorrect.";
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    render(user.role === "admin" ? "admin" : "employee");
  });
}

// ADMIN DASHBOARD

function adminPage() {
  const employees = read("employees");
  const attendance = read("attendance");
  const leaves = read("leaves");

  app.innerHTML = `
    ${header(getUser()?.name || "Admin")}

    <main class="container">
      <p class="eyebrow">WORKSPACE OVERVIEW</p>
      <h1>Admin Dashboard</h1>

      <p class="muted">
        Manage employees, attendance, leaves, and company settings.
      </p>

      <section class="stats">
        <article class="stat">
          <span>Total employees</span>
          <strong>${employees.length}</strong>
        </article>

        <article class="stat">
          <span>Attendance records</span>
          <strong>${attendance.length}</strong>
        </article>

        <article class="stat">
          <span>Pending leave requests</span>
          <strong>${leaves.filter(x => x.status === "Pending").length}</strong>
        </article>
      </section>

      <section class="panel">
        <h2>Add employee</h2>

        <form id="employeeForm" class="employee-form">
          <div>
            <label for="empName">Full name</label>
            <input id="empName" required placeholder="Employee name">
          </div>

          <div>
            <label for="empEmail">Email</label>
            <input id="empEmail" type="email" required
              placeholder="employee@hcm.local">
          </div>

          <div>
            <label for="empPassword">Temporary password</label>
            <input id="empPassword" type="password"
              minlength="4" required
              placeholder="At least 4 characters">
          </div>

          <button class="primary">Add employee</button>
        </form>

        <p id="employeeMessage" class="form-message"></p>
      </section>

      <section class="panel">
        <h2>Employees</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              ${
                employees.length
                  ? employees.map(e => `
                    <tr>
                      <td>${esc(e.name)}</td>
                      <td>${esc(e.email)}</td>
                      <td>
                        <button class="danger"
                          data-delete="${esc(e.email)}">
                          Delete
                        </button>
                      </td>
                    </tr>
                  `).join("")
                  : '<tr><td colspan="3">No employees added yet.</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </section>

      <nav class="quick-links">
        <a class="quick-link" href="#" data-page="attendance">
          <b>Attendance</b>
          <small>View check-in and check-out records</small>
        </a>

        <a class="quick-link" href="#" data-page="leaves">
          <b>Leave management</b>
          <small>Approve or reject requests</small>
        </a>

        <a class="quick-link" href="#" data-page="settings">
          <b>Company settings</b>
          <small>Update company details</small>
        </a>
      </nav>
    </main>
  `;

  document.getElementById("employeeForm")
    .addEventListener("submit", e => {
      e.preventDefault();

      const name = document.getElementById("empName").value.trim();

      const email = document.getElementById("empEmail")
        .value.trim().toLowerCase();

      const password = document.getElementById("empPassword").value;

      const users = read("users");

      if (users.some(u => u.email.toLowerCase() === email)) {
        document.getElementById("employeeMessage").textContent =
          "That email already exists.";
        return;
      }

      const employee = {
        name,
        email,
        password,
        role: "employee"
      };

      save("employees", [...read("employees"), employee]);
      save("users", [...users, employee]);

      render("admin");
    });

  app.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.dataset.delete;

      if (!confirm("Delete this employee account? Existing records will remain.")) {
        return;
      }

      save(
        "employees",
        read("employees").filter(e => e.email !== email)
      );

      save(
        "users",
        read("users").filter(
          u => !(u.email === email && u.role === "employee")
        )
      );

      render("admin");
    });
  });
}

// EMPLOYEE DASHBOARD

function employeePage() {
  const user = getUser();

  const attendance = read("attendance")
    .filter(x => x.employeeEmail === user.email);

  const leaves = read("leaves")
    .filter(x => x.employeeEmail === user.email);

  app.innerHTML = `
    ${header("Hi, " + (user.name || "Employee"))}

    <main class="container">
      <p class="eyebrow">EMPLOYEE WORKSPACE</p>
      <h1>My Dashboard</h1>
      <p class="muted">Track attendance and request time off.</p>

      <section class="stats two">
        <article class="stat">
          <span>My attendance records</span>
          <strong>${attendance.length}</strong>
        </article>

        <article class="stat">
          <span>My leave requests</span>
          <strong>${leaves.length}</strong>
        </article>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>Attendance</h2>

          <p class="muted">
            Check in when you start and check out when you finish.
          </p>

          <div class="button-row">
            <button id="checkIn" class="primary">Check in</button>
            <button id="checkOut" class="secondary">Check out</button>
          </div>

          <p id="attendanceMessage" class="message"></p>
        </article>

        <article class="panel">
          <h2>Request leave</h2>

          <form id="leaveForm">
            <label for="leaveDate">Leave date</label>
            <input id="leaveDate" type="date"
              min="${today()}" required>

            <label for="leaveReason">Reason</label>
            <textarea id="leaveReason" rows="3" maxlength="300"
              required placeholder="Enter your reason"></textarea>

            <button class="primary">Submit request</button>
          </form>

          <p id="leaveMessage" class="message"></p>
        </article>
      </section>

      <section class="panel">
        <h2>My leave requests</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${
                leaves.length
                  ? leaves.slice().reverse().map(l => `
                    <tr>
                      <td>${esc(l.date)}</td>
                      <td>${esc(l.reason)}</td>
                      <td>${esc(l.status)}</td>
                    </tr>
                  `).join("")
                  : '<tr><td colspan="3">No leave requests yet.</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  document.getElementById("checkIn").addEventListener("click", () => {
    const records = read("attendance");
    const date = today();

    if (records.some(
      x => x.employeeEmail === user.email &&
           x.date === date &&
           !x.checkOut
    )) {
      document.getElementById("attendanceMessage").textContent =
        "Already checked in. Check out first.";
      return;
    }

    records.push({
      id: Date.now(),
      employeeEmail: user.email,
      date,
      checkIn: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
      checkOut: "",
      status: "Checked In"
    });

    save("attendance", records);
    render("employee");
  });

  document.getElementById("checkOut").addEventListener("click", () => {
    const records = read("attendance");

    const record = records.find(
      x => x.employeeEmail === user.email &&
           x.date === today() &&
           !x.checkOut
    );

    if (!record) {
      document.getElementById("attendanceMessage").textContent =
        "No open check-in found for today.";
      return;
    }

    record.checkOut = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    record.status = "Checked Out";

    save("attendance", records);
    render("employee");
  });

  document.getElementById("leaveForm").addEventListener("submit", e => {
    e.preventDefault();

    const date = document.getElementById("leaveDate").value;

    const reason = document.getElementById("leaveReason")
      .value.trim();

    if (date < today()) {
      document.getElementById("leaveMessage").textContent =
        "Choose today or a future date.";
      return;
    }

    const requests = read("leaves");

    requests.push({
      id: Date.now(),
      employeeEmail: user.email,
      employeeName: user.name,
      date,
      reason,
      status: "Pending"
    });

    save("leaves", requests);
    render("employee");
  });
}

// ATTENDANCE PAGE

function attendancePage() {
  const records = read("attendance").slice().reverse();
  const users = read("users");

  const employeeName = email => {
    const user = users.find(u => u.email === email);
    return user?.name || email || "Unknown employee";
  };

  const todaysRecords = records.filter(record => record.date === today());

  const checkedIn = todaysRecords
    .filter(record => !record.checkOut).length;

  const checkedOut = todaysRecords
    .filter(record => Boolean(record.checkOut)).length;

  app.innerHTML = `
    ${header("Attendance Overview")}

    <main class="container">
      <p class="eyebrow">WORKPLACE RECORDS</p>
      <h1>Attendance Overview</h1>
      <p class="muted">View employee check-in and check-out records.</p>

      <section class="stats">
        <article class="stat">
          <span>Today's Records</span>
          <strong>${todaysRecords.length}</strong>
        </article>

        <article class="stat">
          <span>Currently Checked In</span>
          <strong>${checkedIn}</strong>
        </article>

        <article class="stat">
          <span>Checked Out Today</span>
          <strong>${checkedOut}</strong>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <h2>All Attendance Records</h2>
            <p class="muted">Records appear after employees check in.</p>
          </div>

          <button class="secondary" id="refreshAttendance" type="button">
            Refresh
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${
                records.length
                  ? records.map(record => `
                    <tr>
                      <td>${esc(employeeName(record.employeeEmail))}</td>
                      <td>${esc(record.employeeEmail)}</td>
                      <td>${esc(record.date)}</td>
                      <td>${esc(record.checkIn || "—")}</td>
                      <td>${esc(record.checkOut || "—")}</td>
                      <td>
                        <span class="attendance-status ${
                          record.checkOut ? "status-done" : "status-active"
                        }">
                          ${record.checkOut ? "Checked Out" : "Checked In"}
                        </span>
                      </td>
                    </tr>
                  `).join("")
                  : '<tr><td colspan="6">No attendance records yet. Log in as an employee and press Check in.</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="button-row">
          <button class="primary" id="backToAdmin" type="button">
            Back to Dashboard
          </button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("refreshAttendance").addEventListener("click", () => {
    render("attendance");
  });

  document.getElementById("backToAdmin").addEventListener("click", () => {
    render("admin");
  });
}

// LEAVE MANAGEMENT PAGE

function leavesPage() {
  const leaves = read("leaves")
    .map(leave => ({
      ...leave,
      status: leave.status || "Pending"
    }))
    .slice()
    .reverse();

  const pending = leaves.filter(
    leave => leave.status === "Pending"
  ).length;

  const approved = leaves.filter(
    leave => leave.status === "Approved"
  ).length;

  const rejected = leaves.filter(
    leave => leave.status === "Rejected"
  ).length;

  app.innerHTML = `
    ${header("Leave Management")}

    <main class="container">
      <p class="eyebrow">TIME OFF</p>
      <h1>Leave Management</h1>

      <p class="muted">
        Review employee leave requests and update their status.
      </p>

      <section class="stats">
        <article class="stat">
          <span>Pending Requests</span>
          <strong>${pending}</strong>
        </article>

        <article class="stat">
          <span>Approved Requests</span>
          <strong>${approved}</strong>
        </article>

        <article class="stat">
          <span>Rejected Requests</span>
          <strong>${rejected}</strong>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <h2>Employee Leave Requests</h2>
            <p class="muted">Approve or reject requests with Pending status.</p>
          </div>

          <button class="secondary" id="refreshLeaves" type="button">
            Refresh
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Leave Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              ${
                leaves.length
                  ? leaves.map(leave => `
                    <tr>
                      <td>${esc(leave.employeeName || "Employee")}</td>
                      <td>${esc(leave.employeeEmail || "—")}</td>
                      <td>${esc(leave.date || "—")}</td>
                      <td>${esc(leave.reason || "—")}</td>
                      <td>
                        <span class="leave-status ${
                          leave.status === "Approved"
                            ? "leave-approved"
                            : leave.status === "Rejected"
                            ? "leave-rejected"
                            : "leave-pending"
                        }">${esc(leave.status)}</span>
                      </td>
                      <td>
                        ${
                          leave.status === "Pending"
                            ? `<div class="leave-actions">
                                <button type="button" class="approve"
                                  data-leave-id="${esc(leave.id)}"
                                  data-leave-status="Approved">
                                  Approve
                                </button>

                                <button type="button" class="reject"
                                  data-leave-id="${esc(leave.id)}"
                                  data-leave-status="Rejected">
                                  Reject
                                </button>
                              </div>`
                            : "Reviewed"
                        }
                      </td>
                    </tr>
                  `).join("")
                  : '<tr><td colspan="6">No leave requests yet. Submit a request from an employee account first.</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="button-row">
          <button class="primary" id="backToAdmin" type="button">
            Back to Dashboard
          </button>
        </div>
      </section>
    </main>
  `;

  app.querySelectorAll("[data-leave-id]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.leaveId;
      const status = button.dataset.leaveStatus;
      const allLeaves = read("leaves");

      const request = allLeaves.find(
        leave => String(leave.id) === id
      );

      if (!request) {
        alert("This leave request could not be found. Refresh the page and try again.");
        return;
      }

      if ((request.status || "Pending") !== "Pending") {
        alert("This request has already been reviewed.");
        render("leaves");
        return;
      }

      request.status = status;

      save("leaves", allLeaves);
      render("leaves");
    });
  });

  document.getElementById("refreshLeaves").addEventListener("click", () => {
    render("leaves");
  });

  document.getElementById("backToAdmin").addEventListener("click", () => {
    render("admin");
  });
}

// COMPANY SETTINGS PAGE

function settingsPage() {
  const s = JSON.parse(
    localStorage.getItem("companySettings") || "null"
  ) || {};

  app.innerHTML = `
    ${header("Company Settings")}

    <main class="container">
      <p class="eyebrow">CONFIGURATION</p>
      <h1>Company Settings</h1>
      <p class="muted">Edit company information for this demo.</p>

      <section class="panel" style="max-width:650px">
        <form id="settingsForm">
          <label for="companyName">Company name</label>
          <input id="companyName" required
            value="${esc(s.name || "")}">

          <label for="companyEmail">Company email</label>
          <input id="companyEmail" type="email" required
            value="${esc(s.email || "")}">

          <label for="companyAddress">Company address</label>
          <textarea id="companyAddress" rows="3" required>${esc(s.address || "")}</textarea>

          <button class="primary">Save settings</button>
          <p id="settingsMessage" class="message"></p>
        </form>
      </section>
    </main>
  `;

  document.getElementById("settingsForm")
    .addEventListener("submit", e => {
      e.preventDefault();

      localStorage.setItem("companySettings", JSON.stringify({
        name: document.getElementById("companyName").value.trim(),
        email: document.getElementById("companyEmail").value.trim(),
        address: document.getElementById("companyAddress").value.trim()
      }));

      document.getElementById("settingsMessage").textContent =
        "Company settings saved.";
    });
}

// PAGE ROUTING

function render(page) {
  const user = getUser();

  if (!user) {
    loginPage();
    return;
  }

  if (user.role === "admin" && page === "employee") {
    page = "admin";
  }

  if (
    user.role === "employee" &&
    ["admin", "attendance", "leaves", "settings"].includes(page)
  ) {
    page = "employee";
  }

  if (
    user.role === "admin" &&
    !["admin", "attendance", "leaves", "settings"].includes(page)
  ) {
    page = "admin";
  }

  if (page === "admin") adminPage();
  else if (page === "employee") employeePage();
  else if (page === "attendance") attendancePage();
  else if (page === "leaves") leavesPage();
  else if (page === "settings") settingsPage();

  const logout = document.getElementById("logoutBtn");

  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      loginPage();
    });
  }

  app.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      render(link.dataset.page);
    });
  });
}

// START APPLICATION

seedAdmin();
render(getUser()?.role === "employee" ? "employee" : "admin");