import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Users, DollarSign, Calendar, PlusCircle, CheckCircle2, BookOpen, Clock, 
  Filter, AlertCircle, Trash2, Edit3, Layers, QrCode, LogOut, Lock, 
  AlertTriangle, UserCheck, Sun, Moon
} from 'lucide-react';

const API_BASE = 'https://nerva-tuitions-backend.onrender.com';
const MOM_UPI_ID = "momname@upi"; // REPLACE WITH YOUR MOM'S UPI ID

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ADMIN STATE
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);

  // FILTERS
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');

  // PARENT STATE
  const [parentStudent, setParentStudent] = useState(null);

  const [studentForm, setStudentForm] = useState({
    name: '', parent_name: '', phone_number: '', email: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    standard: '10th Standard', subjects: 'Mathematics, Science',
    custom_fee: 3000, payment_type: '3_MONTHS', batch_timing: '4:00 PM - 5:00 PM'
  });

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') fetchAdminData();
    if (currentUser?.role === 'PARENT') fetchParentData();
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { phone: loginPhone, password: loginPassword });
      setCurrentUser(res.data);
    } catch (err) {
      alert("Invalid login details!\n\nAdmin: 'admin' / 'admin123'\nParent: Use registered phone number.");
    }
  };

  const fetchAdminData = async () => {
    try {
      const studentsRes = await axios.get(`${API_BASE}/students/`);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParentData = async () => {
    try {
      const studentRes = await axios.get(`${API_BASE}/students/${currentUser.student_id}`);
      setParentStudent(studentRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleParentClaimPayment = async () => {
    try {
      await axios.post(`${API_BASE}/payments/student/${parentStudent.id}/claim`);
      alert("Status updated! Admin Ma'am will verify your payment shortly.");
      fetchParentData();
    } catch (err) {
      alert("Failed to submit claim.");
    }
  };

  const handleAdminApprovePayment = async (studentId) => {
    try {
      const res = await axios.post(`${API_BASE}/payments/student/${studentId}/pay`);
      setQrStudent(null);
      alert(`Payment of ₹${res.data.amount_paid} recorded successfully!`);
      fetchAdminData();
    } catch (err) {
      alert("Failed to record payment.");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...studentForm,
        email: studentForm.email.trim() === '' ? null : studentForm.email,
        custom_fee: parseFloat(studentForm.custom_fee)
      };
      await axios.post(`${API_BASE}/students/`, payload);
      setShowAddModal(false);
      alert("Student Enrolled Successfully!");
      resetForm();
      fetchAdminData();
    } catch (err) {
      alert("Failed to enroll student.");
    }
  };

  const handleOpenEditModal = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name, parent_name: student.parent_name, phone_number: student.phone_number,
      email: student.email || '', enrollment_date: student.enrollment_date, standard: student.standard,
      subjects: student.subjects, custom_fee: student.custom_fee, payment_type: student.payment_type,
      batch_timing: student.batch_timing
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...studentForm,
        email: studentForm.email.trim() === '' ? null : studentForm.email,
        custom_fee: parseFloat(studentForm.custom_fee)
      };
      await axios.put(`${API_BASE}/students/${editingStudentId}`, payload);
      setShowEditModal(false);
      alert("Student Details Updated Successfully!");
      resetForm();
      fetchAdminData();
    } catch (err) {
      alert("Failed to update student.");
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName}?`)) return;
    try {
      await axios.delete(`${API_BASE}/students/${studentId}`);
      alert(`${studentName} removed successfully.`);
      fetchAdminData();
    } catch (err) {
      alert("Failed to remove student.");
    }
  };

  const resetForm = () => {
    setStudentForm({
      name: '', parent_name: '', phone_number: '', email: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      standard: '10th Standard', subjects: 'Mathematics, Science',
      custom_fee: 3000, payment_type: '3_MONTHS', batch_timing: '4:00 PM - 5:00 PM'
    });
    setEditingStudentId(null);
  };

  // 1. LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
        <div className={`p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Nerva Tuitions</h2>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition cursor-pointer ${darkMode ? 'bg-slate-700 text-amber-400' : 'bg-slate-100 text-slate-600'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase opacity-60 mb-1">Phone / Username</label>
              <input 
                type="text" 
                required 
                value={loginPhone} 
                onChange={(e) => setLoginPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`} 
                placeholder="Admin: 'admin' or Parent Phone" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-60 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`} 
                placeholder="Admin: 'admin123' or any key for parent" 
              />
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-md cursor-pointer text-sm">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PARENT PORTAL
  if (currentUser.role === 'PARENT' && parentStudent) {
    const isQuarterly = parentStudent.payment_type === '3_MONTHS';
    const baseDue = isQuarterly ? parentStudent.custom_fee * 3 : parentStudent.custom_fee;
    const lateFee = parentStudent.late_fee || 0;
    const totalDue = baseDue + lateFee;

    const upiUri = `upi://pay?pa=${MOM_UPI_ID}&pn=NervaTuitions&am=${totalDue}&tn=TuitionFee_${parentStudent.name.replace(/\s+/g, '')}`;

    return (
      <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <header className="bg-indigo-700 text-white px-4 sm:px-6 py-3.5 flex justify-between items-center shadow-md">
          <h1 className="font-bold text-base sm:text-lg">Nerva Tuitions</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setCurrentUser(null)} className="flex items-center space-x-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <div className={`p-5 sm:p-6 rounded-2xl shadow-sm border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h2 className="text-xl sm:text-2xl font-bold">{parentStudent.name}</h2>
            <p className="text-xs text-indigo-400 font-semibold mt-0.5">{parentStudent.standard} • {parentStudent.subjects}</p>
            <p className="text-xs opacity-60 mt-1">Batch: {parentStudent.batch_timing}</p>

            <div className={`my-5 p-3.5 rounded-xl border flex justify-between items-center text-left ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className="text-[10px] uppercase font-bold opacity-60">Term Window</p>
                <p className="text-xs font-semibold mt-0.5">{parentStudent.term_start} ➔ {parentStudent.term_end}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold opacity-60">Total Amount</p>
                <p className="text-lg sm:text-xl font-black text-indigo-500">₹{totalDue}</p>
              </div>
            </div>

            {lateFee > 0 && parentStudent.payment_status !== 'PAID' && (
              <div className="text-xs text-rose-500 font-bold mb-4 bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20 inline-flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                <span>Includes ₹{lateFee} Late Fee Penalty</span>
              </div>
            )}

            {parentStudent.payment_status === 'PAID' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="font-bold text-sm">Term Fee Settled (Paid ✓)</span>
              </div>
            )}

            {parentStudent.payment_status === 'CLAIMED' && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-center space-x-2 text-amber-400">
                <UserCheck className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-sm">Payment Claimed! Awaiting Verification</span>
              </div>
            )}

            {parentStudent.payment_status === 'UNPAID' && (
              <div className="space-y-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 inline-block shadow-inner">
                  <QRCodeSVG value={upiUri} size={150} level="H" />
                </div>
                <p className="text-[11px] opacity-60">Scan with GPay, PhonePe, or Paytm to pay</p>

                <button 
                  onClick={handleParentClaimPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer text-sm"
                >
                  I Have Transferred Fee ✓
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 3. ADMIN DASHBOARD
  const filteredStudents = students.filter(s => {
    const matchesBatch = selectedBatchFilter === 'ALL' || s.batch_timing === selectedBatchFilter;
    const matchesPlan = selectedPlanFilter === 'ALL' || s.payment_type === selectedPlanFilter;
    return matchesBatch && matchesPlan;
  });

  // Calculate total collected including base fees + late fee penalties
  const totalCollected = filteredStudents
    .filter(s => s.payment_status === 'PAID')
    .reduce((sum, s) => {
      const baseFee = s.payment_type === '3_MONTHS' ? s.custom_fee * 3 : s.custom_fee;
      const lateFee = s.late_fee || 0;
      return sum + baseFee + lateFee;
    }, 0);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-200" />
            <h1 className="text-base sm:text-xl font-bold tracking-wide">Nerva Tuitions</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }} 
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition text-xs sm:text-sm shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Enroll Student</span>
              <span className="sm:hidden">Enroll</span>
            </button>
            <button 
              onClick={() => setCurrentUser(null)} 
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className={`p-3 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase opacity-60">Plan Mode:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:space-x-2">
            {[
              { id: 'ALL', label: 'All Plans' },
              { id: 'MONTHLY', label: 'Monthly' },
              { id: '3_MONTHS', label: '3-Month' },
            ].map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanFilter(plan.id)}
                className={`py-1.5 px-2.5 sm:px-4 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                  selectedPlanFilter === plan.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className={`p-4 sm:p-6 rounded-xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div>
              <p className="text-[11px] sm:text-xs uppercase font-semibold opacity-60">Total Collected</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">₹{totalCollected.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-500/10 p-2.5 sm:p-3 rounded-full text-emerald-500">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className={`p-4 sm:p-6 rounded-xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div>
              <p className="text-[11px] sm:text-xs uppercase font-semibold opacity-60">Employer Share (40%)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-500 mt-0.5 sm:mt-1">₹{(totalCollected * 0.4).toLocaleString()}</h3>
            </div>
            <div className="bg-amber-500/10 p-2.5 sm:p-3 rounded-full text-amber-500">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className={`p-4 sm:p-6 rounded-xl shadow-sm border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div>
              <p className="text-[11px] sm:text-xs uppercase font-semibold opacity-60">Mom's Take-Home (60%)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-400 mt-0.5 sm:mt-1">₹{(totalCollected * 0.6).toLocaleString()}</h3>
            </div>
            <div className="bg-indigo-500/10 p-2.5 sm:p-3 rounded-full text-indigo-400">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5">
          <span className="text-xs font-semibold uppercase opacity-60 flex items-center shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> Batch:
          </span>
          {[
            { id: 'ALL', label: 'All Batches' },
            { id: '4:00 PM - 5:00 PM', label: '4 - 5 PM' },
            { id: '5:00 PM - 6:00 PM', label: '5 - 6 PM' },
            { id: '1:00 PM - 2:00 PM (Sat)', label: 'Sat (1-2 PM)' },
          ].map((batch) => (
            <button
              key={batch.id}
              onClick={() => setSelectedBatchFilter(batch.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                selectedBatchFilter === batch.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {batch.label}
            </button>
          ))}
        </div>

        <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`px-4 sm:px-6 py-3.5 border-b flex justify-between items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h2 className="text-base sm:text-lg font-bold">
              Enrolled Students ({filteredStudents.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className={`text-[11px] sm:text-xs uppercase font-semibold border-b ${darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  <th className="px-4 sm:px-6 py-3">Student & Class</th>
                  <th className="px-4 sm:px-6 py-3">Batch</th>
                  <th className="px-4 sm:px-6 py-3">Subjects</th>
                  <th className="px-4 sm:px-6 py-3">Term Window</th>
                  <th className="px-4 sm:px-6 py-3">Amount Due</th>
                  <th className="px-4 sm:px-6 py-3">Parent</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs sm:text-sm ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center opacity-40">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const isQuarterly = student.payment_type === '3_MONTHS';
                    const baseDue = isQuarterly ? student.custom_fee * 3 : student.custom_fee;
                    const lateFee = student.late_fee || 0;
                    const totalDueWithPenalty = baseDue + lateFee;

                    return (
                      <tr key={student.id} className={`transition ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-xs text-indigo-400 font-medium">{student.standard}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${darkMode ? 'bg-purple-950/50 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {student.batch_timing}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 opacity-80">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3.5 h-3.5 opacity-50 shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{student.subjects}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs opacity-80 whitespace-nowrap">
                          <div><span className="font-semibold">From:</span> {student.term_start}</div>
                          <div><span className="font-semibold">To:</span> {student.term_end}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                          <div className="font-bold">₹{totalDueWithPenalty}</div>
                          {lateFee > 0 && (
                            <div className="text-[10px] text-rose-500 font-bold flex items-center mt-0.5">
                              <AlertTriangle className="w-3 h-3 mr-0.5 shrink-0" />
                              Includes ₹{lateFee} Late Fee
                            </div>
                          )}
                          <div className="text-[10px] opacity-40">
                            {isQuarterly ? '(3 Months)' : '(1 Month)'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 opacity-80 whitespace-nowrap">
                          <div>{student.parent_name}</div>
                          <div className="text-xs opacity-50">{student.phone_number}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {student.payment_status === 'PAID' && (
                              <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg text-xs border border-emerald-500/20 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Paid ✓</span>
                              </span>
                            )}

                            {student.payment_status === 'CLAIMED' && (
                              <button
                                onClick={() => handleAdminApprovePayment(student.id)}
                                className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 py-1 rounded-lg transition text-xs shadow-sm cursor-pointer animate-pulse"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Verify Claim?</span>
                              </button>
                            )}

                            {student.payment_status === 'UNPAID' && (
                              <>
                                <button
                                  onClick={() => setQrStudent(student)}
                                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2 py-1 rounded-lg transition text-xs shadow-sm cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>QR</span>
                                </button>

                                <button
                                  onClick={() => handleAdminApprovePayment(student.id)}
                                  className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-2 py-1 rounded-lg transition text-xs shadow-sm cursor-pointer"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className={`p-1 rounded-lg transition cursor-pointer ${darkMode ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className={`p-1 rounded-lg transition cursor-pointer ${darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADMIN UPI QR MODAL */}
      {qrStudent && (() => {
        const isQuarterly = qrStudent.payment_type === '3_MONTHS';
        const baseDue = isQuarterly ? qrStudent.custom_fee * 3 : qrStudent.custom_fee;
        const lateFee = qrStudent.late_fee || 0;
        const totalDue = baseDue + lateFee;
        const upiUri = `upi://pay?pa=${MOM_UPI_ID}&pn=NervaTuitions&am=${totalDue}&tn=TuitionFee_${qrStudent.name.replace(/\s+/g, '')}`;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden text-center p-5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-base">In-Person UPI QR</h3>
                <button onClick={() => setQrStudent(null)} className="opacity-50 hover:opacity-100 font-bold text-base cursor-pointer">✕</button>
              </div>

              <p className="text-xs opacity-60 mb-1">Student: <span className="font-bold">{qrStudent.name}</span></p>
              <div className="text-xl font-black text-indigo-400 mb-2">₹{totalDue}</div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-inner mb-3">
                <QRCodeSVG value={upiUri} size={140} level="H" />
              </div>

              <button
                onClick={() => handleAdminApprovePayment(qrStudent.id)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs cursor-pointer shadow-sm"
              >
                Confirm Payment Received ✓
              </button>
            </div>
          </div>
        );
      })()}

      {/* ENROLLMENT & EDIT MODALS */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className={`rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="px-5 py-3.5 bg-indigo-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm sm:text-base">{showEditModal ? 'Edit Student Details' : 'Enroll New Student'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-white/80 hover:text-white cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={showEditModal ? handleUpdateStudent : handleAddStudent} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">Student Name</label>
                  <input type="text" required value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} placeholder="Navanshi" />
                </div>
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">Standard / Class</label>
                  <input type="text" required value={studentForm.standard} onChange={(e) => setStudentForm({...studentForm, standard: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} placeholder="10th Standard" />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase opacity-60 mb-1">Batch Schedule</label>
                <select 
                  value={studentForm.batch_timing} 
                  onChange={(e) => setStudentForm({...studentForm, batch_timing: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`}
                >
                  <option value="4:00 PM - 5:00 PM">Daily: 4:00 PM - 5:00 PM</option>
                  <option value="5:00 PM - 6:00 PM">Daily: 5:00 PM - 6:00 PM</option>
                  <option value="1:00 PM - 2:00 PM (Sat)">Saturday Only: 1:00 PM - 2:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase opacity-60 mb-1">Subjects Enrolled</label>
                <input type="text" required value={studentForm.subjects} onChange={(e) => setStudentForm({...studentForm, subjects: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} placeholder="Mathematics, Science" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">Monthly Fee (₹)</label>
                  <input type="number" required value={studentForm.custom_fee} onChange={(e) => setStudentForm({...studentForm, custom_fee: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} />
                </div>
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">Payment Frequency</label>
                  <select value={studentForm.payment_type} onChange={(e) => setStudentForm({...studentForm, payment_type: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`}>
                    <option value="3_MONTHS">3 Months Together</option>
                    <option value="MONTHLY">Monthly Basis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">Parent Name</label>
                  <input type="text" required value={studentForm.parent_name} onChange={(e) => setStudentForm({...studentForm, parent_name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} placeholder="Madhura" />
                </div>
                <div>
                  <label className="block font-semibold uppercase opacity-60 mb-1">WhatsApp Phone</label>
                  <input type="text" required value={studentForm.phone_number} onChange={(e) => setStudentForm({...studentForm, phone_number: e.target.value})} className={`w-full px-3 py-2 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}`} placeholder="9876543210" />
                </div>
              </div>

              <div className="pt-3 flex space-x-2.5">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="w-1/2 px-3 py-2 border border-slate-500 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 px-3 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer font-bold">
                  {showEditModal ? 'Save Changes' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}