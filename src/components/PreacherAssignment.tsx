import React from 'react';
import { Download } from 'lucide-react';
import domtoimage from 'dom-to-image';
import { jsPDF } from 'jspdf';
import { DayView } from './DayView';

export const PreacherAssignment = ({ staffGroups, events, db, appId, doc, setDoc, backgroundColor, isWaitingForTableSelection, selectedCalendarCell, onAssignmentComplete, onAddThemeText, initialDate, userRole, onMonthChange, onBack }: { staffGroups: any[], events: any[], db: any, appId: string, doc: any, setDoc: any, backgroundColor: string, isWaitingForTableSelection: boolean, selectedCalendarCell: { dateKey: string } | null, onAssignmentComplete?: (data?: { dateKey: string, assignment?: string, preacher?: string }) => void, onAddThemeText?: () => void, initialDate?: Date, userRole?: 'admin' | 'preacher_manager' | 'singer_manager' | null, onMonthChange?: (d: Date) => void, onBack?: () => void }) => {
  const [currentDate, setCurrentDate] = React.useState(() => {
    if (initialDate) return initialDate;
    const d = new Date();
    if (userRole === 'admin') {
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    d.setMonth(d.getMonth() + 1);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);
  
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };
  
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    const container = document.getElementById('pdf-container');
    const tableElement = tableContainerRef.current;
    if (!container || !tableElement) return;

    setIsGeneratingPdf(true);
    
    try {
      const originalMaxHeight = tableElement.style.maxHeight;
      const originalOverflow = tableElement.style.overflow;
      const originalScrollTop = tableElement.scrollTop;

      // Prepare for full capture
      tableElement.style.maxHeight = 'none';
      tableElement.style.overflow = 'visible';
      tableElement.scrollTop = 0;
      
      const monthLabel = document.createElement('div');
      monthLabel.innerText = `Призначення проповідників (${currentDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })})`;
      monthLabel.style.fontSize = '18px';
      monthLabel.style.fontWeight = 'bold';
      monthLabel.style.padding = '10px';
      monthLabel.style.textAlign = 'center';
      monthLabel.style.backgroundColor = '#ffffff';
      tableElement.prepend(monthLabel);
      
      // Try to un-stick headers for capture
      const headers = tableElement.querySelectorAll('th');
      headers.forEach(h => {
        h.style.position = 'static';
        h.style.top = 'auto';
      });

      // Increase delay to let browser apply styles fully
      await new Promise(resolve => setTimeout(resolve, 500));

      const imgData = await domtoimage.toPng(tableElement, {
        bgcolor: '#ffffff',
        width: tableElement.scrollWidth,
        height: tableElement.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        filter: (node) => {
          // Filter out elements with 'no-print-pdf' class
          if (node.classList && node.classList.contains('no-print-pdf')) {
            return false;
          }
          return true;
        }
      });
      
      tableElement.removeChild(monthLabel);
      
      // Calculate PDF dimensions (A4 portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // We need to get the image dimensions to calculate the ratio
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => { img.onload = resolve; });

      // Calculate image dimensions to fit width
      let imgWidth = pdfWidth - 20; // 10mm margin on each side
      let imgHeight = (img.height * imgWidth) / img.width;
      
      // If it's too tall, scale it down to fit height
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = (img.width * imgHeight) / img.height;
      }
      
      // Add image centered horizontally
      const xOffset = (pdfWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight);
      
      const monthNames = ['січ.', 'лют.', 'берез.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'верес.', 'жовт.', 'листоп.', 'груд.'];
      const startMonth = currentDate.getMonth();
      const startYear = currentDate.getFullYear();
      const endDate = new Date(startYear, startMonth + 1, 1);
      const endMonth = endDate.getMonth();
      const endYear = endDate.getFullYear();
      
      const startMonthName = monthNames[startMonth];
      const endMonthName = monthNames[endMonth];
      
      const fileName = `ЗАЛУЧ. ПРОПОВ._${startMonthName}${startYear} - ${endMonthName}${endYear}.pdf`;
      const pdfOutput = pdf.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Restore original styles
      tableElement.style.maxHeight = originalMaxHeight;
      tableElement.style.overflow = originalOverflow;
      tableElement.scrollTop = originalScrollTop;

      // Restore header styles
      headers.forEach(h => {
        h.style.position = '';
        h.style.top = '';
      });
      
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Помилка при створенні PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(newDate);
    if(onMonthChange) onMonthChange(newDate);
  };

  const isPastMonth = currentDate < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const days = [];
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if ([3, 5, 0].includes(d.getDay())) {
      days.push(new Date(d));
    }
  }

  const filteredDays = days;

  const preachersOnly = staffGroups
    .filter(g => g.label === "НА ВСІ ДНІ" || g.label.includes("БУДНІ"))
    .map(g => ({
      ...g,
      items: [...g.items].sort((a, b) => a.localeCompare(b))
    }));
  const [localAssignments, setLocalAssignments] = React.useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCell, setSelectedCell] = React.useState<{ preacher: string, date: Date } | null>(null);
  const [selectedFunction, setSelectedFunction] = React.useState('');
  const [participationNumber, setParticipationNumber] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [applyFilter, setApplyFilter] = React.useState(false);

  React.useEffect(() => {
    if (selectedFunction !== 'пр.') {
      setParticipationNumber(1);
    }
  }, [selectedFunction]);

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedCalendarCell && tableContainerRef.current) {
      const dateKey = selectedCalendarCell.dateKey;
      const dayIndex = days.findIndex(d => formatDateKey(d) === dateKey);
      if (dayIndex !== -1) {
        // Find the header element for the day
        const headerElements = tableContainerRef.current.querySelectorAll('th[data-date-key]');
        const targetHeader = headerElements[dayIndex] as HTMLElement;
        if (targetHeader) {
          // Scroll the container to the target header
          tableContainerRef.current.scrollLeft = targetHeader.offsetLeft - 150; // Adjust offset to position it near the list
        }
      }
    }
  }, [selectedCalendarCell, days]);

  const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleCellClick = (preacher: string, date: Date, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isWaitingForTableSelection && selectedCalendarCell) {
      const [year, month, day] = selectedCalendarCell.dateKey.split('-').map(Number);
      const calendarDate = new Date(year, month - 1, day);
      setSelectedCell({ preacher, date: calendarDate });
      setSelectedDate(calendarDate);
      setSelectedFunction('ПРОПОВІДЬ');
      setParticipationNumber(1);
      setIsModalOpen(true);
    } else if (!isPastMonth) {
      setSelectedCell({ preacher, date });
      setSelectedDate(date);
      setSelectedFunction('ПРОПОВІДЬ');
      setParticipationNumber(1);
      setIsModalOpen(true);
    }
  };

  const handleAssign = async () => {
    console.log("handleAssign called");
    console.log("events:", events);
    console.log("selectedCell:", selectedCell);
    console.log("selectedFunction:", selectedFunction);
    console.log("participationNumber:", participationNumber);
    
    if (!selectedCell) {
      console.log("selectedCell is null");
      return;
    }
    
    const dateKey = formatDateKey(selectedCell.date);
    console.log("dateKey:", dateKey);
    
    // Check for duplicate sermon order number
    if (selectedFunction === 'ПРОПОВІДЬ') {
      if (!participationNumber) {
        alert("Будь ласка, виберіть порядковий номер для проповіді.");
        return;
      }
      const event = events.find(e => e.id === dateKey);
      console.log("Event found:", event);
      const isDuplicate = event?.leads?.some((l: string) => {
        const parts = l.split('|');
        return parts[0] === participationNumber.toString() && parts[1] === 'пр.';
      });
      console.log("isDuplicate:", isDuplicate);
      if (isDuplicate) {
        alert(`Черговість ${participationNumber} вже зайнята на цей день.`);
        return;
      }
    }

    // Check for duplicate preacher assignment for the SAME function
    const existingEvent = events.find(e => e.id === dateKey);
    // Removed the check that blocked assigning the same preacher to multiple functions on the same day.

    const shortFunction = {
      'ВЕДУЧИЙ': 'вед.',
      'ПРОПОВІДЬ': 'пр.',
      'ВІДПОВІДАЛЬНИЙ': 'відп.',
      'ПРИЧАСТЯ': 'ПРИЧ.',
      'ХРЕЩЕННЯ': 'Хрещ.'
    }[selectedFunction] || selectedFunction;

    const isSermon = selectedFunction === 'ПРОПОВІДЬ';
    const numPart = isSermon ? participationNumber : '';
    const fullAssignment = `${numPart}|${shortFunction}|${selectedFunction}|${selectedCell.preacher}`;
    
    setLocalAssignments(prev => ({ ...prev, [`${dateKey}_${selectedCell.preacher}`]: `${isSermon ? (participationNumber || '') : ''} ${shortFunction}`.trim() }));

    const event = events.find(e => e.id === dateKey);
    const currentLeads = event?.leads || [];
    const updatedLeads = [...currentLeads, fullAssignment];
      
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', dateKey);
    console.log("Повний шлях запису:", docRef.path);
    try {
      await setDoc(docRef, { leads: updatedLeads }, { merge: true });
      console.log("Firestore успішно оновлено");
    } catch (error) {
      console.error("Помилка оновлення Firestore:", error);
    }

    console.log("Calling onAssignmentComplete");
    if (onAssignmentComplete) {
        onAssignmentComplete({ 
          dateKey, 
          assignment: `${selectedCell.preacher} (${selectedFunction.toLowerCase()})` 
        });
    } else {
        console.log("onAssignmentComplete is undefined");
    }
  };

  const handleRemoveAssignment = async () => {
    if (!selectedCell) return;
    const dateKey = formatDateKey(selectedCell.date);
    
    setLocalAssignments(prev => {
      const next = { ...prev };
      delete next[`${dateKey}_${selectedCell.preacher}`];
      return next;
    });

    const event = events.find(e => e.id === dateKey);
    if (event && event.leads) {
      const updatedLeads = event.leads.filter((l: string) => !l.includes(selectedCell.preacher));
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', dateKey), { leads: updatedLeads }, { merge: true });
    }
    setSelectedCell(null);
    setIsModalOpen(false);
    onAssignmentComplete({ dateKey, preacher: selectedCell.preacher });
  };

  const getDayStyle = (day: number) => {
    if (day === 0) return '#C1D5D8'; // Нд
    if (day === 5) return '#E8D1D1'; // Пт
    if (day === 3) return '#F0F0F0'; // Ср
    return '#ffffff'; // Default
  };

  return (
    <div id="pdf-container" className="w-full h-full flex flex-col bg-white rounded-2xl p-6 border border-slate-300 shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
      {onBack && (
        <div className="mb-2 print:hidden no-print-pdf flex justify-start">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[0.625rem] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            ⬅ Назад
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-4 text-lg print:mb-2 shrink-0">
        <h2 className="text-black font-black uppercase flex items-center gap-4 text-[1em] print:text-lg whitespace-nowrap">
          <button className="print:hidden no-print-pdf" onClick={() => changeMonth(-1)}>&lt;</button>
          Призначення проповідників ({currentDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })})
          <button className="print:hidden no-print-pdf" onClick={() => changeMonth(1)}>&gt;</button>
        </h2>
        {(userRole === 'admin' || userRole === 'preacher_manager') && (
          <div className="flex items-center gap-2 print:hidden no-print-pdf">
            <button 
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`p-[0.5em] bg-slate-200 hover:bg-slate-300 text-slate-700 text-[0.5em] rounded-lg transition-all flex items-center justify-center aspect-square ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Завантажити PDF"
            >
              <Download size="1.5em" className={isGeneratingPdf ? 'animate-pulse' : ''} />
            </button>
            <button 
              onClick={onAddThemeText}
              className="px-[1em] py-[0.5em] bg-amber-600 hover:bg-amber-700 text-white text-[0.5em] font-black uppercase rounded-lg transition-all"
            >
              ДОДАТИ ТЕКСТ МІСЯЦЯ
            </button>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden print:block print:overflow-visible">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden print:block print:overflow-visible">
          {/* Таблиця */}
          <div ref={tableContainerRef} className="text-black text-[0.625rem] md:text-xs overflow-auto border-2 border-slate-400 rounded-lg bg-white relative print:max-h-none print:overflow-visible print:border-none print:rounded-none">
            <table className="w-full border-separate border-spacing-0 min-w-max print:border-collapse print:min-w-full">
              <thead>
                <tr>
                  <th className="border-b-2 border-r-2 border-slate-400 p-2 bg-slate-200 sticky top-0 left-0 z-[60] text-[20px]">№</th>
                  <th className="border-b-2 border-r-2 border-slate-400 p-2 bg-slate-200 sticky top-0 left-8 z-[60] text-[20px]">
                    <div className="whitespace-nowrap px-2 text-left">Прізвище, ім'я</div>
                  </th>
                  {filteredDays.map((d) => {
                    const isSelectedDay = selectedCalendarCell && formatDateKey(d) === selectedCalendarCell.dateKey;
                    const shouldDarken = selectedCalendarCell && !isSelectedDay;
                    return (
                      <th 
                        key={d.toISOString()} 
                        data-date-key={formatDateKey(d)}
                        className={`border-b-2 border-r-2 border-slate-400 p-1 cursor-pointer hover:bg-slate-300 sticky top-0 z-[50] ${d.getDay() === 0 ? 'bg-blue-100' : ''} ${shouldDarken ? 'bg-slate-300' : ''}`} 
                        style={{ backgroundColor: shouldDarken ? '#cbd5e1' : getDayStyle(d.getDay()) }}
                        onClick={() => setSelectedDate(d)}
                      >
                        <div className="min-w-[2.5rem] flex flex-col items-center justify-center gap-0 py-1">
                          <span className="text-[20px] font-black text-slate-900 leading-none">
                            {d.getDate()}
                          </span>
                          <span className="text-[0.6875rem] font-bold text-slate-500 uppercase leading-none tracking-tighter">
                            {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()]}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {preachersOnly.map((group) => (
                  <React.Fragment key={group.label}>
                    <tr>
                      <td 
                        colSpan={2 + filteredDays.length} 
                        className="bg-slate-300 font-bold p-2 border-b-2 border-slate-400 text-black sticky top-[2.975rem] z-[55] shadow-sm text-[20px]"
                      >
                        {group.label}
                      </td>
                    </tr>
                    {group.items.map((item: string, iIdx: number) => (
                      <tr key={item}>
                        <td className="border-b border-r border-slate-400 p-2 text-center sticky left-0 z-20 bg-white text-[20px]">{iIdx + 1}</td>
                        <td className="border-b border-r border-slate-400 p-2 sticky left-8 z-20 bg-white whitespace-nowrap font-bold text-[20px]">{item}</td>
                        {filteredDays.map((d) => {
                          const dateKey = formatDateKey(d);
                          const event = events.find(e => e.id === dateKey);
                          const assignments = event?.leads?.filter((l: string) => l.includes(item)) || [];
                          
                          const displayElements = assignments.map((assignment, idx) => {
                            let displayValue = '';
                            let isVeduchyi = false;
                            let isVidpovidalnyi = false;

                            if (assignment.includes('|')) {
                                const [number, shortFunc, fullFunc, name] = assignment.split('|');
                                displayValue = `${number} ${shortFunc}`.trim();
                                isVeduchyi = fullFunc.toUpperCase() === 'ВЕДУЧИЙ';
                                isVidpovidalnyi = fullFunc.toUpperCase() === 'ВІДПОВІДАЛЬНИЙ';
                            } else {
                                const parts = assignment.split(' ');
                                if (parts.length >= 2 && !isNaN(Number(parts[0]))) {
                                    displayValue = `${parts[0]} ${parts[1]}`;
                                } else {
                                    displayValue = assignment;
                                }
                                isVeduchyi = assignment.toUpperCase().includes('ВЕДУЧИЙ') || assignment.toLowerCase().includes('вед.');
                                isVidpovidalnyi = assignment.toUpperCase().includes('ВІДПОВІДАЛЬНИЙ') || assignment.toLowerCase().includes('відп.');
                            }

                            let color = undefined;
                            if (isVeduchyi) color = '#16a34a';
                            else if (isVidpovidalnyi) color = '#dc2626';

                            return <span key={idx} style={{ color, display: 'block' }}>{displayValue}</span>;
                          });

                          const isSelectedDay = selectedCalendarCell && formatDateKey(d) === selectedCalendarCell.dateKey;
                          const shouldDarken = selectedCalendarCell && !isSelectedDay;
                          const isSelected = selectedCell?.preacher === item && selectedCell?.date.toISOString() === d.toISOString();
                          
                          return (
                            <td 
                              key={d.toISOString()} 
                              className={`border-b border-r border-slate-400 p-2 min-w-[2.5rem] cursor-pointer hover:bg-slate-100 text-center font-bold text-[20px] ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''} ${shouldDarken ? 'bg-slate-300' : ''}`} 
                              style={{ backgroundColor: isSelected ? undefined : (shouldDarken ? '#94a3b8' : getDayStyle(d.getDay())) }} 
                              onClick={(e) => handleCellClick(item, d, e)}
                            >
                              {displayElements.length > 0 ? displayElements : <span style={{ color: '#003366' }}>{localAssignments[`${dateKey}_${item}`] || ''}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && selectedCell && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { setIsModalOpen(false); setSelectedCell(null); }}>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-white font-black uppercase text-sm">
                  {selectedCell.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setSelectedCell(null); }} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="text-white text-xs font-bold uppercase mb-4 text-center">
                {selectedCell.preacher}
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/20 flex flex-col gap-3">
                <div className="text-white text-[0.625rem] font-bold uppercase opacity-70">ФУНКЦІЯ</div>
                
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { short: 'ВЕДУЧИЙ', long: 'ВЕДУЧИЙ' },
                      { short: 'ПРОПОВІДЬ', long: 'ПРОПОВІДЬ' },
                      { short: 'ВІДПОВІДАЛЬНИЙ', long: 'ВІДПОВІДАЛЬНИЙ' },
                      { short: 'ПРИЧАСТЯ', long: 'ПРИЧАСТЯ' },
                      { short: 'ХРЕЩЕННЯ', long: 'ХРЕЩЕННЯ' }
                    ].map(f => (
                      <button 
                        key={f.long}
                        onClick={() => setSelectedFunction(f.long)}
                        className={`py-1 rounded text-[0.5625rem] font-bold uppercase transition-all ${selectedFunction === f.long ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                      >
                        {f.short}
                      </button>
                    ))}
                  </div>

                  {selectedFunction === 'ПРОПОВІДЬ' && (
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                      <span className="text-white text-[0.625rem] font-bold uppercase">Черговість:</span>
                      <select 
                        value={participationNumber} 
                        onChange={(e) => setParticipationNumber(Number(e.target.value))}
                        className="bg-black/40 text-white font-black text-sm p-1 rounded"
                      >
                        {[1, 2, 3, 4, 5].filter(num => 
                          num === participationNumber || !events.find(e => e.id === formatDateKey(selectedCell.date))?.leads?.some(l => {
                            const parts = l.split('|');
                            return parts[0] === num.toString() && parts[1] === 'пр.';
                          })
                        ).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={handleAssign}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-[0.625rem] font-black uppercase transition-all"
                    >
                      Призначити
                    </button>
                    <button 
                      onClick={handleRemoveAssignment}
                      className="px-3 bg-red-600/50 hover:bg-red-600 text-white py-2 rounded-lg text-[0.625rem] font-black uppercase transition-all"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
