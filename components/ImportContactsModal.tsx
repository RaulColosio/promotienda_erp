import React, { useState, useCallback, useMemo } from 'react';
import { useCrm } from '../store/crmStore';
import { Contact } from '../types';
import Modal from './Modal';
import { UploadCloudIcon, RefreshCwIcon, CheckCircleIcon } from './Icons';

type CrmContactField = keyof Omit<Contact, 'id' | 'createdAt' | 'deletedAt'>;

const MAPPING_SUGGESTIONS: { [key: string]: CrmContactField } = {
  'first name': 'firstName', 'firstname': 'firstName', 'nombre': 'firstName', 'nombres': 'firstName',
  'last name': 'lastName', 'lastname': 'lastName', 'apellido': 'lastName', 'apellidos': 'lastName',
  'email': 'email', 'email address': 'email', 'correo': 'email', 'correo electrónico': 'email',
  'email 2': 'email2', 'secondary email': 'email2', 'email secundario': 'email2',
  'phone': 'phone', 'phone number': 'phone', 'teléfono': 'phone', 'telefono': 'phone', 'móvil': 'phone', 'movil': 'phone',
  'company': 'company', 'empresa': 'company', 'organización': 'company',
  'drive url': 'googleDriveFolderUrl', 'google drive': 'googleDriveFolderUrl', 'folder url': 'googleDriveFolderUrl',
};

const getSuggestedMapping = (header: string): CrmContactField | 'ignore' => {
    const lowerHeader = header.toLowerCase().trim().replace(/_/g, ' ');
    return MAPPING_SUGGESTIONS[lowerHeader] || 'ignore';
};

const CRM_FIELDS: { key: CrmContactField; label: string }[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'email2', label: 'Secondary Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'googleDriveFolderUrl', label: 'Google Drive URL' },
];

const parseCSV = (csvText: string): { headers: string[], data: Record<string, string>[] } => {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 1) return { headers: [], data: [] };
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        let value = (values[index] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        row[header] = value;
      });
      return row;
    });
    
    return { headers, data };
};


const ImportContactsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { bulkAddContacts } = useCrm();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<Record<string, string>[]>([]);
    const [mapping, setMapping] = useState<Record<string, CrmContactField | 'ignore'>>({});
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setHeaders([]);
        setData([]);
        setMapping({});
        setError(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFile = (fileToProcess: File) => {
        setError(null);
        if (fileToProcess && fileToProcess.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const { headers: parsedHeaders, data: parsedData } = parseCSV(text);
                    if (parsedHeaders.length === 0 || parsedData.length === 0) {
                        setError("File is empty or not formatted correctly.");
                        return;
                    }
                    setFile(fileToProcess);
                    setHeaders(parsedHeaders);
                    setData(parsedData);
                    const initialMapping = parsedHeaders.reduce((acc, header) => {
                        acc[header] = getSuggestedMapping(header);
                        return acc;
                    }, {} as Record<string, CrmContactField | 'ignore'>);
                    setMapping(initialMapping);
                    setStep(2);
                } catch (err) {
                    setError("Failed to parse CSV file. Please check its format.");
                }
            };
            reader.readAsText(fileToProcess);
        } else {
            setError('Please upload a valid CSV file.');
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMappingChange = (csvHeader: string, crmField: CrmContactField | 'ignore') => {
        setMapping(prev => ({ ...prev, [csvHeader]: crmField }));
    };

    const handleImport = async () => {
        setStep(3); // Importing step
        try {
            const contactsToImport: Omit<Contact, 'id' | 'createdAt'>[] = data.map(row => {
                const contact: Partial<Omit<Contact, 'id' | 'createdAt'>> = {};
                for (const csvHeader in mapping) {
                    const crmField = mapping[csvHeader];
                    if (crmField !== 'ignore') {
                        (contact as any)[crmField] = row[csvHeader];
                    }
                }
                return contact as Omit<Contact, 'id' | 'createdAt'>;
            });
            await bulkAddContacts(contactsToImport);
            setStep(4); // Success step
        } catch (err) {
            setError("An error occurred during import. Please try again.");
            setStep(2); // Go back to mapping step on error
        }
    };

    const isNextDisabled = useMemo(() => {
        const mappedFields = Object.values(mapping);
        const essentialFields: CrmContactField[] = ['firstName', 'lastName', 'company', 'email', 'phone'];
        return !mappedFields.some(field => essentialFields.includes(field as CrmContactField));
    }, [mapping]);
    
    const Step1_Upload = () => (
        <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800">Upload CSV File</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Select a CSV file containing the contacts you want to import.</p>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 rounded-lg p-10"
            >
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                    <UploadCloudIcon className="w-12 h-12 text-slate-400" />
                    <p className="mt-2 font-semibold text-slate-700">
                        <span className="text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">CSV file up to 5MB</p>
                    <input id="csv-upload" type="file" accept=".csv" onChange={onFileChange} className="sr-only" />
                </label>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
    );
    
    const Step2_Map = () => (
        <div>
            <h3 className="text-lg font-semibold text-slate-800">Map Fields</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Match the columns from your CSV to the fields in the CRM. At least one of name, company, email or phone must be mapped.</p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-b pb-4">
                {headers.map(header => (
                    <div key={header} className="grid grid-cols-2 gap-4 items-center">
                        <span className="font-medium text-slate-700 text-sm truncate" title={header}>{header}</span>
                        <select
                            value={mapping[header] || 'ignore'}
                            onChange={e => handleMappingChange(header, e.target.value as CrmContactField | 'ignore')}
                             className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="ignore">Ignore this column</option>
                            {CRM_FIELDS.map(field => (
                                <option key={field.key} value={field.key}>{field.label}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            <div className="mt-4">
                <h4 className="font-semibold text-sm text-slate-600 mb-2">Data Preview</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                {headers.map(header => {
                                    const crmField = CRM_FIELDS.find(f => f.key === mapping[header]);
                                    return <th key={header} className="p-2 text-left font-medium text-slate-500">{crmField ? crmField.label : '(ignored)'}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {data.slice(0, 3).map((row, index) => (
                                <tr key={index}>
                                    {headers.map(header => <td key={header} className="p-2 text-slate-600 truncate max-w-[100px]">{row[header]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
    );

    const Step3_Importing = () => (
        <div className="text-center p-8 flex flex-col items-center">
            <RefreshCwIcon className="w-12 h-12 text-blue-600 animate-spin" />
            <h3 className="text-lg font-semibold text-slate-800 mt-4">Importing Contacts...</h3>
            <p className="text-sm text-slate-500 mt-1">Please wait while we process your file.</p>
        </div>
    );
    
    const Step4_Result = () => (
         <div className="text-center p-8 flex flex-col items-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <h3 className="text-lg font-semibold text-slate-800 mt-4">Import Successful</h3>
            <p className="text-sm text-slate-500 mt-1">{data.length} contacts have been successfully imported.</p>
        </div>
    );

    const renderContent = () => {
        switch (step) {
            case 1: return <Step1_Upload />;
            case 2: return <Step2_Map />;
            case 3: return <Step3_Importing />;
            case 4: return <Step4_Result />;
            default: return null;
        }
    };
    
    const renderFooter = () => {
        if (step === 1 || step === 3) {
            return (
                <div className="flex justify-end">
                    <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200">Cancel</button>
                </div>
            )
        }
        if (step === 2) {
             return (
                <div className="flex justify-between items-center">
                    <button type="button" onClick={() => { setFile(null); setStep(1); }} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100">Back</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={isNextDisabled}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        Import
                    </button>
                </div>
            )
        }
        if (step === 4) {
             return (
                <div className="flex justify-end">
                    <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Done</button>
                </div>
            )
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Contacts">
           <div className="min-h-[400px] flex flex-col">
                <div className="flex-grow">
                     {renderContent()}
                </div>
                <div className="flex-shrink-0 pt-6 mt-6 border-t">
                    {renderFooter()}
                </div>
           </div>
        </Modal>
    );
};

export default ImportContactsModal;