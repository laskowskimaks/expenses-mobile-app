import { useReducer, useMemo, useState, useEffect } from 'react';

const initialState = {
  type: 'expenditure',
  title: '',
  amount: '',
  description: '',
  location: '',
  selectedCategory: null,
  date: new Date(),
  time: new Date(),
  tags: [],
  tagSearchText: '',
  isPeriodic: false,
  repeatInterval: '1',
  repeatUnit: 'month',
  endDate: null,
  isTagsModalVisible: false,
  isRepeatUnitPickerVisible: false,
  showDatePicker: false,
  showTimePicker: false,
  showEndDatePicker: false,
  isSaving: false,
};

export const ACTIONS = {
  SET_TYPE: 'SET_TYPE',
  SET_TITLE: 'SET_TITLE',
  SET_AMOUNT: 'SET_AMOUNT',
  SET_DESCRIPTION: 'SET_DESCRIPTION',
  SET_LOCATION: 'SET_LOCATION',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_DATE: 'SET_DATE',
  SET_TIME: 'SET_TIME',
  ADD_TAG: 'ADD_TAG',
  REMOVE_TAG: 'REMOVE_TAG',
  SET_TAGS: 'SET_TAGS',
  SET_TAG_SEARCH_TEXT: 'SET_TAG_SEARCH_TEXT',
  SET_IS_PERIODIC: 'SET_IS_PERIODIC',
  SET_REPEAT_INTERVAL: 'SET_REPEAT_INTERVAL',
  SET_REPEAT_UNIT: 'SET_REPEAT_UNIT',
  SET_END_DATE: 'SET_END_DATE',
  REMOVE_END_DATE: 'REMOVE_END_DATE',
  TOGGLE_TAGS_MODAL: 'TOGGLE_TAGS_MODAL',
  TOGGLE_REPEAT_UNIT_PICKER: 'TOGGLE_REPEAT_UNIT_PICKER',
  TOGGLE_DATE_PICKER: 'TOGGLE_DATE_PICKER',
  TOGGLE_TIME_PICKER: 'TOGGLE_TIME_PICKER',
  TOGGLE_END_DATE_PICKER: 'TOGGLE_END_DATE_PICKER',
  SET_IS_SAVING: 'SET_IS_SAVING',
  RESET_FORM: 'RESET_FORM',
  SET_FIELD: 'SET_FIELD',
  POPULATE_FORM_FOR_EDIT: 'POPULATE_FORM_FOR_EDIT',
};

function formatAmountInput(input) {
  if (typeof input !== 'string') {
    return input == null ? '' : String(input);
  }

  let cleaned = input.replace(/[^0-9,.]/g, '');
  cleaned = cleaned.replace(',', '.');

  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  if (parts.length === 2) {
    const [wholePart, decimalPart] = parts;
    cleaned = wholePart + '.' + (decimalPart || '').substring(0, 2);
  }

  cleaned = cleaned.replace(/^0+(?=\d)/, '');

  if (cleaned === '' || cleaned === '.') {
    return '';
  }

  return cleaned;
}

function transactionFormReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_TYPE:
      return { ...state, type: action.payload };
    case ACTIONS.SET_TITLE:
      return { ...state, title: action.payload };
    case ACTIONS.SET_AMOUNT: {
      const rawAmount = action.payload;
      const safe = (typeof rawAmount === 'string') ? rawAmount : (rawAmount == null ? '' : String(rawAmount));
      const formattedAmount = formatAmountInput(safe);
      return { ...state, amount: formattedAmount };
    }
    case ACTIONS.SET_DESCRIPTION:
      return { ...state, description: action.payload };
    case ACTIONS.SET_LOCATION:
      return { ...state, location: action.payload };
    case ACTIONS.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload };
    case ACTIONS.SET_DATE:
      return { ...state, date: action.payload };
    case ACTIONS.SET_TIME:
      return { ...state, time: action.payload };
    case ACTIONS.ADD_TAG:
      if (state.tags.includes(action.payload)) return state;
      return { ...state, tags: [...state.tags, action.payload] };
    case ACTIONS.REMOVE_TAG:
      return { ...state, tags: state.tags.filter(tag => tag !== action.payload) };
    case ACTIONS.SET_TAGS:
      return { ...state, tags: action.payload };
    case ACTIONS.SET_TAG_SEARCH_TEXT:
      return { ...state, tagSearchText: action.payload };
    case ACTIONS.SET_IS_PERIODIC:
      return { ...state, isPeriodic: action.payload };
    case ACTIONS.SET_REPEAT_INTERVAL:
      return { ...state, repeatInterval: action.payload };
    case ACTIONS.SET_REPEAT_UNIT:
      return { ...state, repeatUnit: action.payload };
    case ACTIONS.SET_END_DATE:
      return { ...state, endDate: action.payload };
    case ACTIONS.REMOVE_END_DATE:
      return { ...state, endDate: null };
    case ACTIONS.TOGGLE_TAGS_MODAL:
      return { ...state, isTagsModalVisible: action.payload };
    case ACTIONS.TOGGLE_REPEAT_UNIT_PICKER:
      return { ...state, isRepeatUnitPickerVisible: action.payload };
    case ACTIONS.TOGGLE_DATE_PICKER:
      return { ...state, showDatePicker: action.payload };
    case ACTIONS.TOGGLE_TIME_PICKER:
      return { ...state, showTimePicker: action.payload };
    case ACTIONS.TOGGLE_END_DATE_PICKER:
      return { ...state, showEndDatePicker: action.payload };
    case ACTIONS.SET_IS_SAVING:
      return { ...state, isSaving: action.payload };
    case ACTIONS.RESET_FORM:
      return { ...initialState, date: new Date(), time: new Date() };
    case ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };
    case ACTIONS.POPULATE_FORM_FOR_EDIT: {
        const { categories, editMode, ...transactionAndPattern } = action.payload;

        if (!transactionAndPattern) return state;

        const { periodicPattern, ...transactionData } = transactionAndPattern;
        const transactionDate = new Date(transactionData.transactionDate * 1000);
        const category = categories.find(c => c.id === transactionData.categoryId);

        const originalNotes = transactionData.notes || '';
        const autoTextRegex = /\s*\n?\(transakcja dodana automatycznie\)$/;
        const cleanedDescription = originalNotes.replace(autoTextRegex, '').trim();

        return {
            ...state,
            type: transactionData.amount > 0 ? 'income' : 'expenditure',
            title: transactionData.title || '',
            amount: String(Math.abs(transactionData.amount)),
            description: cleanedDescription,
            location: transactionData.location || '',
            selectedCategory: category || null,
            date: transactionDate,
            time: transactionDate,
            tags: (transactionData.tags || []).map(t => t.name),
            isPeriodic: editMode === 'future',
            repeatInterval: periodicPattern ? String(periodicPattern.repeatInterval) : '1',
            repeatUnit: periodicPattern ? periodicPattern.repeatUnit : 'month',
            endDate: periodicPattern && periodicPattern.endDate ? new Date(periodicPattern.endDate * 1000) : null,
        };
    }
    default:
      return state;
  }
}

export function useTransactionForm() {
  const [state, dispatch] = useReducer(transactionFormReducer, initialState);

  const [debouncedTagSearchText, setDebouncedTagSearchText] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTagSearchText(state.tagSearchText);
    }, 300);
    return () => clearTimeout(handler);
  }, [state.tagSearchText]);

  const isButtonDisabled = useMemo(() => {
    const amountNumber = parseFloat((state.amount || '').replace(',', '.'));
    const isValidAmount = !isNaN(amountNumber) && amountNumber > 0;
    
    const isPeriodicAction = state.isPeriodic;
    const intervalInt = parseInt(state.repeatInterval, 10);
    const isValidInterval = !isPeriodicAction || (!isNaN(intervalInt) && intervalInt >= 1 && intervalInt <= 1000);

    return !state.title.trim() ||
      !state.amount.trim() ||
      !isValidAmount ||
      !state.selectedCategory ||
      !isValidInterval;
  }, [state.title, state.amount, state.selectedCategory, state.isPeriodic, state.repeatInterval]);

  const actions = useMemo(() => ({
    setType: (type) => dispatch({ type: ACTIONS.SET_TYPE, payload: type }),
    setTitle: (title) => dispatch({ type: ACTIONS.SET_TITLE, payload: title }),
    setAmount: (amount) => dispatch({ type: ACTIONS.SET_AMOUNT, payload: amount }),
    setDescription: (description) => dispatch({ type: ACTIONS.SET_DESCRIPTION, payload: description }),
    setLocation: (location) => dispatch({ type: ACTIONS.SET_LOCATION, payload: location }),
    setSelectedCategory: (category) => dispatch({ type: ACTIONS.SET_SELECTED_CATEGORY, payload: category }),
    setDate: (date) => dispatch({ type: ACTIONS.SET_DATE, payload: date }),
    setTime: (time) => dispatch({ type: ACTIONS.SET_TIME, payload: time }),
    addTag: (tag) => dispatch({ type: ACTIONS.ADD_TAG, payload: tag }),
    removeTag: (tag) => dispatch({ type: ACTIONS.REMOVE_TAG, payload: tag }),
    setTagSearchText: (text) => dispatch({ type: ACTIONS.SET_TAG_SEARCH_TEXT, payload: text }),
    setIsPeriodic: (isPeriodic) => dispatch({ type: ACTIONS.SET_IS_PERIODIC, payload: isPeriodic }),
    setRepeatInterval: (interval) => dispatch({ type: ACTIONS.SET_REPEAT_INTERVAL, payload: interval }),
    setRepeatUnit: (unit) => dispatch({ type: ACTIONS.SET_REPEAT_UNIT, payload: unit }),
    setEndDate: (date) => dispatch({ type: ACTIONS.SET_END_DATE, payload: date }),
    removeEndDate: () => dispatch({ type: ACTIONS.REMOVE_END_DATE }),
    toggleTagsModal: (visible) => dispatch({ type: ACTIONS.TOGGLE_TAGS_MODAL, payload: visible }),
    toggleRepeatUnitPicker: (visible) => dispatch({ type: ACTIONS.TOGGLE_REPEAT_UNIT_PICKER, payload: visible }),
    toggleDatePicker: (visible) => dispatch({ type: ACTIONS.TOGGLE_DATE_PICKER, payload: visible }),
    toggleTimePicker: (visible) => dispatch({ type: ACTIONS.TOGGLE_TIME_PICKER, payload: visible }),
    toggleEndDatePicker: (visible) => dispatch({ type: ACTIONS.TOGGLE_END_DATE_PICKER, payload: visible }),
    setIsSaving: (saving) => dispatch({ type: ACTIONS.SET_IS_SAVING, payload: saving }),
    resetForm: () => dispatch({ type: ACTIONS.RESET_FORM }),
  }), []);

  return {
    state,
    dispatch,
    actions,
    isButtonDisabled,
    debouncedTagSearchText,
  };
}