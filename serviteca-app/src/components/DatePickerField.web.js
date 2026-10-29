// ============================================================
// CAMPO DE FECHA / HORA (WEB)
// ============================================================
// El selector nativo no existe en web; se mantiene el campo de
// texto con el mismo formato que consume la API.
// ============================================================

import Input from './Input';

export default function DatePickerField({
  label,
  mode = 'date',
  value,
  onChange,
  placeholder,
}) {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      keyboardType="numbers-and-punctuation"
      maxLength={mode === 'date' ? 10 : 5}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}
