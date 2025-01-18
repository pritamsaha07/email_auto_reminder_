import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, addDays } from "date-fns";

const InvoiceDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [sending, setSending] = useState(false);
  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/extract-excel");
      const processedData = response.data.data.map((invoice) => ({
        ...invoice,
        "Invoice Date": excelDateToJSDate(invoice["Invoice Date"]),
        "Due Date": excelDateToJSDate(invoice["Due Date"]),
      }));
      setInvoices(processedData);
      setError("");
    } catch (err) {
      setError("Failed to fetch invoice data");
      showToast("Failed to fetch invoice data", "error");
    }
    setLoading(false);
  };

  const excelDateToJSDate = (excelDate) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return format(date, "MM/dd/yyyy");
  };

  const sendReminders = async () => {
    setSending(true);
    const threeDaysFromNow = addDays(new Date(), 3);
    const upcomingInvoices = invoices.filter((invoice) => {
      const dueDate = new Date(invoice["Due Date"]);
      return dueDate <= threeDaysFromNow && dueDate >= new Date();
    });

    try {
      for (const invoice of upcomingInvoices) {
        await axios.post("http://localhost:3000/send-reminder", {
          email: `${invoice["Customer Name"]
            .toLowerCase()
            .replace(/ /g, ".")}@example.com`,
          eventName: `Invoice ${invoice["Invoice Number"]} Due Soon`,
          eventDate: invoice["Due Date"],
        });
      }
      showToast(`Successfully sent ${upcomingInvoices.length} reminders`);
    } catch (err) {
      showToast("Failed to send reminders", "error");
    }
    setSending(false);
  };

  return (
    <>
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            <div className="flex items-center">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast({ show: false, message: "", type: "" })}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Invoice Dashboard</h1>
            <button
              onClick={sendReminders}
              disabled={sending}
              className={`${
                sending ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
              } text-white px-4 py-2 rounded transition-colors flex items-center`}
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending Reminders...
                </>
              ) : (
                "Send 3-Day Reminders"
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded bg-red-100 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {invoices.length > 0 &&
                      Object.keys(invoices[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice, index) => (
                    <tr
                      key={invoice["Invoice Number"]}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Object.values(invoice).map((value, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {typeof value === "number"
                            ? value.toLocaleString("en-US", {
                                style:
                                  value === invoice.Price
                                    ? "currency"
                                    : "decimal",
                                currency: "USD",
                                minimumFractionDigits: 2,
                              })
                            : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default InvoiceDashboard;
