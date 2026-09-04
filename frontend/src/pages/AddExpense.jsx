import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

function AddExpense() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleCancel = (e) => {
    e.preventDefault();
    navigate('/expenses');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        navigate('/expenses');
      } else {
        alert('Failed to add expense.');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding expense.');
    }
  };

  return (
    <>
      <PageHeader title="Add expense" sub="Record a business cost" />
      
      <div className="card-panel p-6 md:p-8 max-w-2xl">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleAdd}>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">Amount</label>
            <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field" placeholder="ETB 0" />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">Date</label>
            <input required type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">Reason</label>
            <input required type="text" name="reason" value={formData.reason} onChange={handleChange} className="input-field" placeholder="What was the expense for?" />
          </div>
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="btn">Add expense</button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default AddExpense;
