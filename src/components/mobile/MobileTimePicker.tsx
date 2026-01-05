import Picker from 'react-mobile-picker';

interface MobileTimePickerProps {
    value: string; // "HH:MM"
    onChange: (value: string) => void;
    label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function MobileTimePicker({ value, onChange, label }: MobileTimePickerProps) {
    const [hour, minute] = value.split(':');

    const pickerValue = {
        hour: hour || '08',
        minute: minute || '00'
    };

    const handleChange = (newValue: { hour: string; minute: string }) => {
        onChange(`${newValue.hour}:${newValue.minute}`);
    };

    return (
        <div className="flex-1">
            {label && (
                <label className="block text-[9px] text-slate-500 mb-1 uppercase tracking-wider font-bold">
                    {label}
                </label>
            )}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <Picker
                    value={pickerValue}
                    onChange={handleChange}
                    wheelMode="natural"
                    height={120}
                >
                    <Picker.Column name="hour">
                        {HOURS.map((h) => (
                            <Picker.Item key={h} value={h}>
                                {({ selected }) => (
                                    <span className={`text-lg font-bold ${selected ? 'text-sky-400' : 'text-slate-500'}`}>
                                        {h}h
                                    </span>
                                )}
                            </Picker.Item>
                        ))}
                    </Picker.Column>
                    <Picker.Column name="minute">
                        {MINUTES.map((m) => (
                            <Picker.Item key={m} value={m}>
                                {({ selected }) => (
                                    <span className={`text-lg font-bold ${selected ? 'text-sky-400' : 'text-slate-500'}`}>
                                        {m}
                                    </span>
                                )}
                            </Picker.Item>
                        ))}
                    </Picker.Column>
                </Picker>
            </div>
        </div>
    );
}
