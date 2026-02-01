import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Flashcard from './src/components/Flashcard';
import ModalPicker from './src/components/ModalPicker';
import GradientBorder from './src/components/GradientBorder';
import VocabItem from './src/components/VocabItem';
import { initDatabase } from './src/db/database';
import { seedDatabase } from './src/db/seed';
import {
  addVocabulary,
  getVocabulary,
  updateVocabulary,
  deleteVocabulary,
  clearAllVocabulary,
  getFlashcards,
  getAvailableYears,
  getDoneList,
  moveToDoneList,
  moveToPracticeList,
  clearDoneList,
} from './src/db/operations';
import {
  validatePracticeFilters,
  validateVocabularyForm,
} from './src/utils/validators';
import { lightTheme, darkTheme } from './src/constants/theme';



const SORT_OPTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MONTHS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

// Months up to and including current month (for all filter routes)
const getAvailableMonths = () => {
  const currentMonthNum = new Date().getMonth() + 1; // 1-12
  return MONTHS.filter((m) => Number(m.value) <= currentMonthNum);
};
const now = new Date();
const CURRENT_MONTH = String(now.getMonth() + 1);
const CURRENT_YEAR = String(now.getFullYear());

const MANAGEMENT_LIMIT = 50;

const INSPIRATIONAL_QUOTES = [
  "Words are the currency of communication.",
  "Every word you learn opens a new door of understanding.",
  "Language is the road map of a culture.",
  "The limits of my language are the limits of my world.",
  "Learning vocabulary is like collecting treasures of knowledge.",
  "Words have the power to inspire, motivate, and transform.",
  "Expand your vocabulary, expand your world.",
  "The best investment you can make is in your vocabulary.",
  "Words are the building blocks of thought.",
  "Master your words, master your expression.",
  "A rich vocabulary is a key to success.",
  "Every new word is a new opportunity.",
  "Language shapes the way we think and perceive.",
  "Build your vocabulary brick by brick, word by word.",
  "Words are the bridges between minds.",
];

const getRandomQuote = () => {
  return INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
};

const getSortType = (name) => {
  const first = (name || '').trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : 'A';
};

const defaultForm = {
  name: '',
  meaning: '',
  sortType: 'A',
  month: CURRENT_MONTH,
  year: CURRENT_YEAR,
};

const defaultFilters = {
  month: '',
  year: '',
  limit: '5',
  sortType: '',
};

const defaultManagementFilters = {
  page: 1,
  sortType: '',
  month: '',
  year: '',
  search: '',
  sortOrder: 'asc', // 'asc' | 'desc'
};

export default function App() {
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [activeView, setActiveView] = useState('home');
  const [form, setForm] = useState(defaultForm);
  const [filters, setFilters] = useState(defaultFilters);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [formStatus, setFormStatus] = useState(null);
  const [practiceStatus, setPracticeStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const hasAutoLoadedRef = useRef(false);
  const [managementList, setManagementList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [listStatus, setListStatus] = useState(null);
  const [managementFilters, setManagementFilters] = useState(
    defaultManagementFilters
  );
  const [managementMeta, setManagementMeta] = useState(null);
  const [showPracticeFilters, setShowPracticeFilters] = useState(false);
  const [showManagementFilters, setShowManagementFilters] = useState(false);
  const [randomQuote, setRandomQuote] = useState(getRandomQuote());
  const [isDbReady, setIsDbReady] = useState(false);
  const [availableYears, setAvailableYears] = useState([CURRENT_YEAR]);
  const [doneList, setDoneList] = useState([]);
  const [isLoadingDoneList, setIsLoadingDoneList] = useState(false);
  const [deletingDoneId, setDeletingDoneId] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isBulkInserting, setIsBulkInserting] = useState(false);
  const [bulkInsertStatus, setBulkInsertStatus] = useState(null);
  const [pastedJson, setPastedJson] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const isEditing = Boolean(editingId);

  // Animation for filter arrow
  const arrowAnim = useRef(new Animated.Value(0)).current;

  // Home page animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const heroTranslateY = useRef(new Animated.Value(30)).current;
  const eyebrowOpacity = useRef(new Animated.Value(0)).current;
  const eyebrowTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(24)).current;
  const buyMeCoffeeOpacity = useRef(new Animated.Value(0)).current;
  const buyMeCoffeeTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (activeView === 'home') {
      heroOpacity.setValue(0);
      heroScale.setValue(0.92);
      heroTranslateY.setValue(30);
      eyebrowOpacity.setValue(0);
      eyebrowTranslateY.setValue(20);
      titleOpacity.setValue(0);
      titleTranslateY.setValue(24);
      subtitleOpacity.setValue(0);
      subtitleTranslateY.setValue(20);
      buttonsOpacity.setValue(0);
      buttonsTranslateY.setValue(24);
      buyMeCoffeeOpacity.setValue(0);
      buyMeCoffeeTranslateY.setValue(50);

      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.spring(heroTranslateY, { toValue: 0, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(eyebrowOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(eyebrowTranslateY, { toValue: 0, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(subtitleTranslateY, { toValue: 0, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(buttonsTranslateY, { toValue: 0, friction: 6, tension: 180, useNativeDriver: true }),
        Animated.timing(buyMeCoffeeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(buyMeCoffeeTranslateY, { toValue: 0, friction: 6, tension: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [activeView]);

  useEffect(() => {
    Animated.timing(arrowAnim, {
      toValue: showManagementFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showManagementFilters]);

  const practiceArrowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(practiceArrowAnim, {
      toValue: showPracticeFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showPracticeFilters]);

  const arrowRotation = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const practiceArrowRotation = practiceArrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });



  // Get current theme colors
  const colors = useMemo(() => theme === 'dark' ? darkTheme : lightTheme, [theme]);

  // Initialize database and seed on app start
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('Initializing local SQLite database...');
        await initDatabase();
        console.log('Database ready!');
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        Alert.alert('Database Error', 'Failed to initialize local database. Please restart the app.');
      }
    };
    initDB();
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loadManagementList = useCallback(async () => {
    setListStatus(null);
    setIsLoadingList(true);
    try {
      const distinctYears = await getAvailableYears();
      const yearsSet = new Set(distinctYears.map(String));
      yearsSet.add(CURRENT_YEAR);
      const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
      setAvailableYears(sortedYears);

      const response = await getVocabulary({
        sortType: managementFilters.sortType,
        month: managementFilters.month ? Number(managementFilters.month) : undefined,
        year: managementFilters.year ? Number(managementFilters.year) : undefined,
        search: managementFilters.search,
        limit: MANAGEMENT_LIMIT,
        page: managementFilters.page,
        sortOrder: managementFilters.sortOrder || 'asc',
      });
      setManagementList(response.data);
      setManagementMeta(response.meta);
    } catch (err) {
      setListStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoadingList(false);
    }
  }, [managementFilters]);

  useEffect(() => {
    if (activeView === 'add' && isDbReady) {
      loadManagementList();
    }
  }, [activeView, loadManagementList, isDbReady]);

  // Auto-load cards and fetch years when practice view opens
  useEffect(() => {
    if (activeView === 'practice') {
      if (!hasAutoLoadedRef.current) {
        hasAutoLoadedRef.current = true;
        // Run seed on practice page load (adds missing sample vocab)
        const runSeedAndLoad = async () => {
          await seedDatabase();
          getAvailableYears().then((years) => {
            const yearsSet = new Set(years.map(String));
            yearsSet.add(CURRENT_YEAR);
            setAvailableYears(Array.from(yearsSet).sort((a, b) => Number(b) - Number(a)));
          });
          handleLoadFlashcards();
        };
        const timer = setTimeout(runSeedAndLoad, 100);
        return () => clearTimeout(timer);
      }
    } else {
      hasAutoLoadedRef.current = false;
    }
  }, [activeView]);

  // Auto-refetch data when sort conditions change (sortType, month, year)
  useEffect(() => {
    // Only refetch if we're in practice view and data has been loaded at least once
    if (activeView === 'practice' && hasAutoLoadedRef.current) {
      // Debounce the refetch to avoid multiple calls
      const timer = setTimeout(() => {
        handleLoadFlashcards();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters.sortType, filters.month, filters.year, activeView, handleLoadFlashcards]);

  useEffect(() => {
    if (activeView === 'doneList') {
      loadDoneList();
    }
  }, [activeView, loadDoneList]);

  // Auto-hide form status (e.g. "Vocabulary saved!") after 3 seconds
  useEffect(() => {
    if (formStatus?.type === 'success') {
      const timer = setTimeout(() => setFormStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  useEffect(() => {
    const trimmed = form.name.trim();
    if (!trimmed) {
      if (form.sortType !== 'A') {
        setForm((prev) => ({ ...prev, sortType: 'A' }));
      }
      return;
    }
    const firstLetter = trimmed[0].toUpperCase();
    if (SORT_OPTIONS.includes(firstLetter) && form.sortType !== firstLetter) {
      setForm((prev) => ({ ...prev, sortType: firstLetter }));
    }
  }, [form.name]);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveVocabulary = async () => {
    setFormStatus(null);
    const error = validateVocabularyForm(form);
    if (error) {
      setFormStatus({ type: 'error', message: error });
      return;
    }

    const payload = {
      ...form,
      month: Number(form.month),
      year: Number(form.year),
    };

    try {
      setIsSaving(true);
      if (isEditing) {
        await updateVocabulary(editingId, payload);
        setFormStatus({ type: 'success', message: 'Vocabulary updated!' });
      } else {
        await addVocabulary(payload);
        setFormStatus({ type: 'success', message: 'Vocabulary saved!' });
      }
      setForm(defaultForm);
      setEditingId(null);
      await loadManagementList();
    } catch (err) {
      setFormStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const processBulkInsertContent = useCallback(async (content) => {
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      setBulkInsertStatus({ type: 'error', message: 'Invalid JSON format.' });
      return;
    }

    const items = Array.isArray(data) ? data : data.items || data.vocabulary || [];
    if (!Array.isArray(items) || items.length === 0) {
      setBulkInsertStatus({
        type: 'error',
        message: 'JSON must contain an array of { name, meaning } objects.',
      });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let inserted = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item?.name != null ? String(item.name).trim() : '';
      const meaning = item?.meaning != null ? String(item.meaning).trim() : '';

      if (!name || !meaning) {
        errors.push(`Row ${i + 1}: missing name or meaning`);
        continue;
      }

      try {
        await addVocabulary({
          name,
          meaning,
          sortType: item.sortType && /^[A-Z]$/i.test(item.sortType) ? item.sortType.toUpperCase() : getSortType(name),
          month: item.month != null && item.month >= 1 && item.month <= 12 ? item.month : currentMonth,
          year: item.year != null && item.year >= 1900 && item.year <= 2100 ? item.year : currentYear,
        });
        inserted++;
      } catch (err) {
        errors.push(`"${name}": ${err.message || 'Insert failed'}`);
      }
    }

    if (inserted > 0) {
      await loadManagementList();
    }

    if (errors.length > 0 && inserted === 0) {
      setBulkInsertStatus({
        type: 'error',
        message: errors.slice(0, 5).join('; ') + (errors.length > 5 ? ` ... +${errors.length - 5} more` : ''),
      });
    } else if (errors.length > 0) {
      setBulkInsertStatus({
        type: 'success',
        message: `Inserted ${inserted} vocabulary. ${errors.length} failed: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '...' : ''}`,
      });
    } else {
      setBulkInsertStatus({ type: 'success', message: `Successfully inserted ${inserted} vocabulary entries!` });
    }
  }, [loadManagementList]);

  const handleBulkInsertFile = useCallback(async () => {
    setBulkInsertStatus(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) {
        setBulkInsertStatus({ type: 'error', message: 'Could not read file.' });
        return;
      }

      setIsBulkInserting(true);
      const file = new File(asset);
      const content = await file.text();
      await processBulkInsertContent(content);
    } catch (err) {
      setBulkInsertStatus({ type: 'error', message: err.message || 'Failed to process file.' });
    } finally {
      setIsBulkInserting(false);
    }
  }, [processBulkInsertContent]);

  const handleBulkInsertPaste = useCallback(async () => {
    setBulkInsertStatus(null);
    const trimmed = pastedJson?.trim();
    if (!trimmed) {
      setBulkInsertStatus({ type: 'error', message: 'Paste JSON first.' });
      return;
    }
    setIsBulkInserting(true);
    try {
      await processBulkInsertContent(trimmed);
      setPastedJson('');
    } finally {
      setIsBulkInserting(false);
    }
  }, [pastedJson, processBulkInsertContent]);

  const handleLoadFlashcards = useCallback(async () => {
    setPracticeStatus(null);

    // Ensure limit has a default value before validation
    const filtersToValidate = {
      ...filters,
      limit: filters.limit || '5',
    };

    const error = validatePracticeFilters(filtersToValidate);
    if (error) {
      setPracticeStatus({ type: 'error', message: error });
      return;
    }

    // Build params for local database
    const params = {
      limit: 1000, // Get a large batch from local DB (no API limit)
    };

    // Only add optional filters if they have values
    if (filters.sortType && filters.sortType.trim() !== '') {
      params.sortType = filters.sortType.trim();
    }

    if (filters.month && filters.month !== '') {
      const monthNum = Number(filters.month);
      if (!Number.isNaN(monthNum)) {
        params.month = monthNum;
      }
    }

    if (filters.year && filters.year !== '') {
      const yearNum = Number(filters.year);
      if (!Number.isNaN(yearNum)) {
        params.year = yearNum;
      }
    }

    try {
      setIsLoadingCards(true);
      const response = await getFlashcards(params);
      const allData = response.data || [];

      setAllFlashcards(allData);
      setCurrentCardIndex(0); // Reset to first page

      if (allData.length === 0) {
        setPracticeStatus({
          type: 'error',
          message: 'No flashcards found. Try different filters.',
        });
      } else {
        setPracticeStatus({
          type: 'success',
          message: `Loaded ${allData.length} flashcards.`,
        });
      }
    } catch (err) {
      setPracticeStatus({
        type: 'error',
        message: err.message || 'Failed to load flashcards. Please try again.'
      });
    } finally {
      setIsLoadingCards(false);
    }
  }, [filters]);

  const handleQuickRange = (value) => {
    const newLimit = String(value);
    handleFilterChange('limit', newLimit);
    setCurrentCardIndex(0); // Reset to first page when limit changes

    // Auto-load data when range button is clicked
    setTimeout(() => {
      handleLoadFlashcards();
    }, 100);
  };

  // Calculate paginated flashcards based on selected limit
  const currentPageFlashcards = useMemo(() => {
    const limit = Number(filters.limit || 5);
    const startIndex = currentCardIndex * limit;
    const endIndex = startIndex + limit;
    return allFlashcards.slice(startIndex, endIndex);
  }, [allFlashcards, currentCardIndex, filters.limit]);

  // Calculate total pages based on selected limit
  const totalPages = useMemo(() => {
    const limit = Number(filters.limit || 5);
    return Math.ceil(allFlashcards.length / limit) || 1;
  }, [allFlashcards.length, filters.limit]);

  const currentPage = currentCardIndex + 1;

  // Navigation functions for prev/next
  const handlePrevPage = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleNextPage = () => {
    const limit = Number(filters.limit || 5);
    const maxIndex = Math.ceil(allFlashcards.length / limit) - 1;
    if (currentCardIndex < maxIndex) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handleMarkDone = useCallback(async (card) => {
    if (!card?.id) return;
    try {
      await moveToDoneList(card.id);
      const prevLen = allFlashcards.length;
      setAllFlashcards((prev) => prev.filter((c) => c.id !== card.id));
      const newLen = prevLen - 1;
      const limit = Number(filters.limit || 5);
      const maxPage = Math.max(0, Math.ceil(newLen / limit) - 1);
      if (currentCardIndex > maxPage) {
        setCurrentCardIndex(maxPage);
      }
      setPracticeStatus({
        type: 'success',
        message: newLen > 0
          ? `Card moved to done list. ${newLen} card${newLen === 1 ? '' : 's'} remaining.`
          : 'Card moved to done list. No cards left.',
      });
    } catch (err) {
      setPracticeStatus({ type: 'error', message: err.message || 'Failed to move to done list.' });
    }
  }, [filters.limit, currentCardIndex, allFlashcards.length]);

  const loadDoneList = useCallback(async () => {
    try {
      setIsLoadingDoneList(true);
      const data = await getDoneList();
      setDoneList(data || []);
    } catch (err) {
      console.error('Failed to load done list:', err);
      setDoneList([]);
    } finally {
      setIsLoadingDoneList(false);
    }
  }, []);

  const handleReturnToPractice = useCallback(async (id) => {
    try {
      await moveToPracticeList(id);
      setDoneList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to return to practice.');
    }
  }, []);

  const handleReturnAllToPractice = useCallback(async () => {
    try {
      for (const item of doneList) {
        await moveToPracticeList(item.id);
      }
      setDoneList([]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to return items to practice.');
    }
  }, [doneList]);

  const handleDeleteFromDoneList = useCallback(async (id) => {
    try {
      setDeletingDoneId(id);
      await deleteVocabulary(id);
      setDoneList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete.');
    } finally {
      setDeletingDoneId(null);
    }
  }, []);

  const confirmClearDoneList = useCallback(() => {
    Alert.alert(
      'Clear Done List',
      'Delete all items in the done list? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDoneList();
              setDoneList([]);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to clear done list.');
            }
          },
        },
      ]
    );
  }, []);

  const handleManagementFilterChange = (key, value) => {
    setManagementFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleManagementPageChange = (direction) => {
    setManagementFilters((prev) => {
      const nextPage =
        direction === 'next'
          ? prev.page + 1
          : Math.max(1, prev.page - 1);
      return { ...prev, page: nextPage };
    });
  };

  const handleResetManagementFilters = () => {
    setManagementFilters({ ...defaultManagementFilters });
  };


  const formatMonthLabel = (value) => {
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    const match = MONTHS.find((month) => month.value === String(value));
    return match ? match.label.slice(0, 3) : value;
  };

  const handleEditEntry = (entry) => {
    setActiveView('add');
    setForm({
      name: entry.name,
      meaning: entry.meaning,
      sortType: entry.sortType,
      month: String(entry.month || ''),
      year: String(entry.year || ''),
    });
    setEditingId(entry.id);
    setFormStatus({ type: 'success', message: `Editing ${entry.name}` });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormStatus(null);
  };

  const handleDeleteEntry = async (id) => {
    if (!id) {
      setFormStatus({ type: 'error', message: 'Cannot delete: Invalid vocabulary ID.' });
      return;
    }
    try {
      setDeletingId(id);
      await deleteVocabulary(id);
      if (editingId === id) {
        handleCancelEdit();
      }
      await loadManagementList();
      setFormStatus({ type: 'success', message: 'Vocabulary deleted.' });
    } catch (err) {
      setFormStatus({ type: 'error', message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteEntry = (entry) => {
    Alert.alert(
      'Delete vocabulary',
      `Delete ${entry.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteEntry(entry.id),
        },
      ]
    );
  };

  const confirmDeleteAll = () => {
    console.log('=== Clear All Button Pressed ===');
    console.log('isDeletingAll:', isDeletingAll);
    console.log('isLoadingList:', isLoadingList);
    console.log('managementMeta:', managementMeta);
    console.log('managementList.length:', managementList.length);

    if (isDeletingAll || isLoadingList) {
      console.log('Button is disabled, returning early');
      return;
    }

    try {
      Alert.alert(
        'Clear All Vocabulary',
        'Are you sure you want to delete ALL vocabulary? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('User cancelled deletion')
          },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: () => {
              console.log('User confirmed deletion - calling handleDeleteAll');
              handleDeleteAll();
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing alert:', error);
      // Fallback: try to delete directly if alert fails
      handleDeleteAll();
    }
  };

  const handleDeleteAll = async () => {
    if (__DEV__) {
      console.log('handleDeleteAll called');
    }
    setIsDeletingAll(true);
    setListStatus(null);
    try {
      if (__DEV__) {
        console.log('Calling clearAllVocabulary...');
      }
      const result = await clearAllVocabulary();
      if (__DEV__) {
        console.log('clearAllVocabulary result:', result);
      }

      // Reset filters and reload list
      setManagementFilters(defaultManagementFilters);
      await loadManagementList();

      setListStatus({
        type: 'success',
        message: `All vocabulary deleted successfully. ${result?.deletedCount || 0} items removed.`
      });
      setForm(defaultForm);
      setEditingId(null);
    } catch (err) {
      console.error('Error deleting all vocabulary:', err);
      setListStatus({
        type: 'error',
        message: err.message || 'Failed to delete all vocabulary. Please try again.'
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const renderVocabItem = useCallback(({ item }) => {
    const mLabel = MONTHS.find(m => String(m.value) === String(item.month))?.label || item.month;
    return (
      <View style={{ paddingHorizontal: 8 }}>
        <VocabItem
          entry={item}
          colors={colors}
          theme={theme}
          onEdit={handleEditEntry}
          onDelete={confirmDeleteEntry}
          deletingId={deletingId}
          monthLabel={mLabel}
        />
      </View>
    );
  }, [colors, theme, deletingId]);

  const renderHome = () => (
    <Animated.View
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.heroBg,
          borderColor: colors.primaryLight,
          opacity: heroOpacity,
          transform: [{ scale: heroScale }, { translateY: heroTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.themeToggleButton, { zIndex: 50, elevation: 50 }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Text style={styles.themeToggleIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        <Text style={styles.themeToggleText}>{theme === 'dark' ? 'Light' : 'Dark'}</Text>
      </TouchableOpacity>
      <Animated.View style={{ opacity: eyebrowOpacity, transform: [{ translateY: eyebrowTranslateY }] }}>
        <Text style={[styles.heroEyebrow, { color: colors.primaryLighter }]}>Welcome to</Text>
      </Animated.View>
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.heroTitle}>Vocab Drill</Text>
      </Animated.View>
      <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] }}>
        <Text style={[styles.heroSubtitle, { color: colors.primaryLighter }]}>
          Build your personal vocabulary deck and practice with flashcards
          anywhere, anytime.
        </Text>
      </Animated.View>
      <Animated.View style={[styles.heroButtons, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] }]}>
        <TouchableOpacity
          style={[styles.primaryCta, { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveView('add')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaText}>Add Vocabulary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryCta, { borderColor: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => setActiveView('practice')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryCtaText}>Practice Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryCta, { borderColor: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => setActiveView('doneList')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryCtaText}>Done List</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const NAGAD_NUMBER = '01796297945';
  const GMAIL_EMAIL = 'dev.koushiik@gmail.com';
  const handleCopyNumber = useCallback(async () => {
    await Clipboard.setStringAsync(NAGAD_NUMBER);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  }, []);
  const handleCopyEmail = useCallback(async () => {
    await Clipboard.setStringAsync(GMAIL_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const renderBuyMeACoffeeSection = () => (
    <View style={[styles.buyMeCoffeeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.bmcHeader}>
        <View style={[styles.bmcIconWrapper, { backgroundColor: theme === 'dark' ? '#332914' : '#FFF9E6' }]}>
          <MaterialIcons name="local-cafe" size={24} color="#D9A646" />
        </View>
        <Text style={[styles.bmcTitle, { color: colors.text }]}>Buy me a coffee</Text>
      </View>

      <Text style={[styles.bmcDescription, { color: colors.textSecondary }]}>
        Enjoying Vocab Drill? Your support helps me keep improving the app and adding new features!
      </Text>

      <View style={[styles.bmcPaymentCard, {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff5f5',
        borderColor: theme === 'dark' ? '#334155' : '#fed7d7'
      }]}>
        <View style={styles.bmcPaymentHeader}>
          <View style={[styles.bmcMethodIcon, { backgroundColor: '#FF413615' }]}>
            <MaterialIcons name="account-balance-wallet" size={18} color="#FF4136" />
          </View>
          <Text style={[styles.bmcMethodName, { color: colors.text }]}>Nagad (Personal)</Text>
        </View>

        <View style={styles.bmcNumberRow}>
          <Text style={[styles.bmcNumberText, { color: colors.text }]}>{NAGAD_NUMBER}</Text>
          <TouchableOpacity
            style={[styles.bmcCopyButton, { backgroundColor: colors.background }]}
            onPress={handleCopyNumber}
            activeOpacity={0.7}
          >
            <Text style={[styles.bmcCopyText, { color: colors.primary }]}>
              {copiedNumber ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bmcPaymentCard, {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#f0f9ff',
        borderColor: theme === 'dark' ? '#334155' : '#bae6fd',
        marginTop: 12
      }]}>
        <View style={styles.bmcPaymentHeader}>
          <View style={[styles.bmcMethodIcon, { backgroundColor: '#3b82f615' }]}>
            <MaterialIcons name="email" size={18} color="#3b82f6" />
          </View>
          <Text style={[styles.bmcMethodName, { color: colors.text }]}>Contact & Feedback</Text>
        </View>

        <View style={styles.bmcNumberRow}>
          <Text style={[styles.bmcNumberText, { color: colors.text, fontSize: 15 }]}>{GMAIL_EMAIL}</Text>
          <TouchableOpacity
            style={[styles.bmcCopyButton, { backgroundColor: colors.background }]}
            onPress={handleCopyEmail}
            activeOpacity={0.7}
          >
            <Text style={[styles.bmcCopyText, { color: colors.primary }]}>
              {copiedEmail ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.bmcFooter, { color: colors.primary }]}>
        🙏 Thank you for your support!
      </Text>
    </View>
  );

  const renderBackButton = (toView = 'home', label = 'Home') => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: colors.backButtonBg,
        borderWidth: 1,
        borderColor: colors.backButtonBorder,
      }}
      onPress={() => setActiveView(toView)}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 20, color: colors.primary }}>←</Text>
      <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderAddSection = () => {
    const cardContent = (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
          {renderBackButton('home', 'Home')}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginBottom: 16,
              borderRadius: 12,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
            onPress={() => setActiveView('bulkInsert')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="upload-file" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Bulk Insert</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Vocabulary</Text>
        {isEditing && (
          <View style={[styles.editBanner, { backgroundColor: colors.quoteBg }]}>
            <Text style={[styles.editBannerText, { color: colors.primary }]}>
              Editing {form.name || 'Vocabulary'}
            </Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={[styles.editBannerAction, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Vocabulary"
          placeholderTextColor={colors.textMuted}
          value={form.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Meaning"
          placeholderTextColor={colors.textMuted}
          multiline
          value={form.meaning}
          onChangeText={(value) => handleInputChange('meaning', value)}
        />




        {formStatus && (
          <Text
            style={[
              styles.feedback,
              formStatus.type === 'error' ? { color: colors.error } : { color: colors.success },
            ]}
          >
            {formStatus.message}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, isSaving && styles.disabledButton]}
          onPress={handleSaveVocabulary}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isEditing ? 'Update Vocabulary' : 'Save Vocabulary'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <View style={[
            styles.filterGroup,
            {
              backgroundColor: colors.filterBg,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 0,
              marginTop: 0,
            },
          ]}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 8,
              }}
              onPress={() => setShowManagementFilters((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={[styles.listTitle, { fontSize: 16, color: colors.text, paddingRight: 0 }]}>
                Search & Filters
              </Text>
              <Animated.Text
                style={{
                  color: colors.filterToggleText,
                  fontSize: 16,
                  fontWeight: 'bold',
                  transform: [{ rotate: arrowRotation }],
                }}
              >
                ▼
              </Animated.Text>
            </TouchableOpacity>

            {showManagementFilters && (
              <View style={{ padding: 10, paddingTop: 0 }}>
                <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                  <TouchableOpacity onPress={handleResetManagementFilters}>
                    <Text style={[styles.clearFilters, { color: colors.error }]}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Search vocabulary"
                  placeholderTextColor={colors.textMuted}
                  value={managementFilters.search}
                  onChangeText={(value) => handleManagementFilterChange('search', value)}
                />

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Sort</Text>
                    <View style={{ marginBottom: 8 }}>
                      <ModalPicker
                        selectedValue={managementFilters.sortType}
                        onValueChange={(value) => handleManagementFilterChange('sortType', value)}
                        items={[{ label: 'All', value: '' }, ...SORT_OPTIONS.map((o) => ({ label: o, value: o }))]}
                        placeholder="All"
                        colors={colors}
                        theme={theme}
                        containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                      />
                    </View>
                  </View>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                    <View style={{ marginBottom: 8 }}>
                      <ModalPicker
                        selectedValue={managementFilters.month}
                        onValueChange={(value) => handleManagementFilterChange('month', value)}
                        items={[{ label: 'All', value: '' }, ...getAvailableMonths()]}
                        placeholder="All"
                        colors={colors}
                        theme={theme}
                        containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                    <View style={{ marginBottom: 8 }}>
                      <ModalPicker
                        selectedValue={managementFilters.year}
                        onValueChange={(value) => handleManagementFilterChange('year', value)}
                        items={[{ label: 'All', value: '' }, ...availableYears.map((y) => ({ label: y, value: y }))]}
                        placeholder="All"
                        colors={colors}
                        theme={theme}
                        containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>




      </View >
    );

    // Wrap with gradient border in dark mode
    return <View style={{ marginBottom: 16 }}>{cardContent}</View>;
  };

  const renderVocabListHeader = () => (
    <View style={[styles.savedVocabSection, { backgroundColor: colors.filterBg, borderColor: colors.border }]}>
      <View style={styles.savedVocabHeader}>
        <View style={styles.savedVocabTitleRow}>
          <MaterialIcons name="menu-book" size={22} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.savedVocabTitle, { color: colors.text }]}>Saved Vocabulary</Text>
        </View>
        <View style={styles.savedVocabActions}>
          <TouchableOpacity
            style={[
              styles.sortOrderButton,
              { borderColor: theme === 'dark' ? colors.borderLight : colors.border, backgroundColor: managementFilters.sortOrder === 'asc' ? colors.primary : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.backButtonBg) },
            ]}
            onPress={() => handleManagementFilterChange('sortOrder', 'asc')}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-upward" size={18} color={managementFilters.sortOrder === 'asc' ? '#fff' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortOrderButton,
              { borderColor: theme === 'dark' ? colors.borderLight : colors.border, backgroundColor: managementFilters.sortOrder === 'desc' ? colors.primary : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.backButtonBg) },
            ]}
            onPress={() => handleManagementFilterChange('sortOrder', 'desc')}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-downward" size={18} color={managementFilters.sortOrder === 'desc' ? '#fff' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.clearAllButton,
              { borderColor: colors.clearAllButtonBorder, backgroundColor: colors.clearAllButtonBg },
              (isDeletingAll || isLoadingList || !managementMeta?.grandTotal) && styles.disabledButton,
            ]}
            onPress={() => confirmDeleteAll()}
            disabled={isDeletingAll || isLoadingList || !managementMeta?.grandTotal}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDeletingAll ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <MaterialIcons name="delete" size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.savedVocabTotalBadge, { backgroundColor: theme === 'dark' ? 'rgba(0,255,0,0.12)' : 'rgba(22,163,74,0.1)', borderColor: theme === 'dark' ? 'rgba(0,255,0,0.25)' : 'rgba(22,163,74,0.25)' }]}>
        <MaterialIcons name="library-books" size={16} color={colors.success} />
        <Text style={[styles.savedVocabTotalText, { color: colors.success }]}>
          {managementMeta?.grandTotal || 0} word{(managementMeta?.grandTotal || 0) !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderPracticeSection = () => (
    <View style={{ paddingHorizontal: 8 }}>
      {renderBackButton()}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Practice Flashcards</Text>


      <View style={{ marginTop: 12, marginBottom: 12 }}>
        <View style={[styles.filterGroup, { backgroundColor: colors.filterBg, borderColor: colors.border, borderRadius: 12, padding: 0, marginTop: 0 }]}>
          <TouchableOpacity
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
            onPress={() => setShowPracticeFilters((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={[styles.listTitle, { fontSize: 16, color: colors.text, paddingRight: 0 }]}>
              {showPracticeFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
            <Animated.Text style={{ color: colors.filterToggleText, fontSize: 16, fontWeight: 'bold', transform: [{ rotate: practiceArrowRotation }] }}>
              ▼
            </Animated.Text>
          </TouchableOpacity>

          {showPracticeFilters && (
            <View style={{ padding: 10, paddingTop: 0 }}>
              <Text style={[styles.label, { color: colors.text }]}>Sort Filter</Text>
              <View style={{ marginBottom: 8 }}>
                <ModalPicker
                  selectedValue={filters.sortType}
                  onValueChange={(value) => handleFilterChange('sortType', value)}
                  items={[{ label: 'A - Z (All)', value: '' }, ...SORT_OPTIONS.map((o) => ({ label: o, value: o }))]}
                  placeholder="A - Z (All)"
                  colors={colors}
                  theme={theme}
                  containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                  <View style={{ marginBottom: 8 }}>
                    <ModalPicker
                      selectedValue={filters.month}
                      onValueChange={(value) => handleFilterChange('month', value)}
                      items={[{ label: 'Any', value: '' }, ...getAvailableMonths()]}
                      placeholder="Any"
                      colors={colors}
                      theme={theme}
                      containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                    />
                  </View>
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                  <View style={{ marginBottom: 8 }}>
                    <ModalPicker
                      selectedValue={filters.year}
                      onValueChange={(value) => handleFilterChange('year', value)}
                      items={[{ label: 'Any', value: '' }, ...availableYears.map((y) => ({ label: y, value: y }))]}
                      placeholder="Any"
                      colors={colors}
                      theme={theme}
                      containerStyle={theme === 'dark' ? { backgroundColor: colors.inputBg, borderColor: colors.border } : { borderColor: colors.border }}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>


      <View style={{ marginTop: 12, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 8 }}>
        <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Range (cards per session)</Text>
        <View style={styles.rangeRow}>
          {[5, 10, 15].map((value) => (
            <TouchableOpacity
              key={`range-${value}`}
              style={[
                styles.rangeButton,
                { borderColor: colors.rangeButtonBorder },
                filters.limit === String(value) && { backgroundColor: colors.rangeButtonActiveBg, borderColor: colors.rangeButtonActiveBorder },
                isLoadingCards && styles.disabledButton,
              ]}
              onPress={() => handleQuickRange(value)}
              disabled={isLoadingCards}
            >
              {isLoadingCards && filters.limit === String(value) ? (
                <ActivityIndicator color={colors.rangeButtonActiveText} size="small" />
              ) : (
                <Text style={[styles.rangeButtonText, { color: colors.rangeButtonText }, filters.limit === String(value) && { color: colors.rangeButtonActiveText }]}>
                  {value} cards
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {practiceStatus && (
          <Text style={[styles.feedback, { marginTop: 8 }, practiceStatus.type === 'error' ? { color: colors.error } : { color: colors.success }]}>
            {practiceStatus.message}
          </Text>
        )}
      </View>

      {isLoadingCards ? (
        <View style={[styles.loadingContainer, { paddingHorizontal: 8 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading flashcards...</Text>
        </View>
      ) : allFlashcards.length > 0 ? (
        <View style={styles.practiceArea}>
          <View style={styles.flashcardGrid}>
            {currentPageFlashcards.map((card, idx) => (
              <View key={card.id || `${card.name}-${card.year}-${idx}`} style={styles.flashcardWrapper}>
                <Flashcard card={card} theme={colors} themeMode={theme} showMarkDone onMarkDone={handleMarkDone} entranceDelay={idx * 80} />
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 8, paddingTop: 16, paddingBottom: 8, width: '100%' }}>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              Showing {currentPageFlashcards.length} of {allFlashcards.length} cards
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </Text>
            {totalPages > 1 && (
              <View style={styles.practiceNav}>
                <TouchableOpacity
                  style={[styles.practiceNavButton, { backgroundColor: colors.practiceNavPrevBg }, (currentCardIndex === 0 || isLoadingCards) && styles.disabledButton]}
                  onPress={handlePrevPage}
                  disabled={currentCardIndex === 0 || isLoadingCards}
                >
                  <Text style={[styles.practiceNavText, { color: colors.practiceNavText }]}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.practiceNavButton, { backgroundColor: colors.practiceNavNextBg }, (currentCardIndex >= totalPages - 1 || isLoadingCards) && styles.disabledButton]}
                  onPress={handleNextPage}
                  disabled={currentCardIndex >= totalPages - 1 || isLoadingCards}
                >
                  <Text style={[styles.practiceNavText, { color: colors.practiceNavText }]}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyStateContainer, { paddingHorizontal: 8 }]}>
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            No flashcards found.
          </Text>
        </View>
      )}
    </View>
  );

  const renderDoneListSection = () => {
    const formatMonthLabel = (value) => {
      if (value === undefined || value === null || value === '') return '—';
      const match = MONTHS.find((m) => m.value === String(value));
      return match ? match.label.slice(0, 3) : value;
    };

    const doneCardBg = theme === 'dark' ? colors.background : '#ffffff';
    const doneCardBorder = theme === 'dark' ? colors.primaryLight : '#f1f5f9';

    return (
      <View style={{ gap: 20, width: '100%', alignItems: 'flex-start' }}>
        {renderBackButton()}
        <View style={{ marginBottom: 4, width: '100%', alignSelf: 'stretch' }}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, textAlign: 'left' }]}>Done List</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: 15, marginTop: 4, textAlign: 'left' }]}>
            Words you've mastered. Return to practice or remove.
          </Text>
        </View>

        {doneList.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 8,
              width: '100%',
              alignSelf: 'stretch',
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: colors.doneListReturnAllBg,
                borderWidth: 1,
                borderColor: colors.doneListReturnAllBorder,
              }}
              onPress={handleReturnAllToPractice}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>↩</Text>
              <Text style={{ color: colors.doneListReturnAllText, fontWeight: '600', fontSize: 15 }}>
                Return All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: colors.doneListClearAllBg,
                borderWidth: 1,
                borderColor: colors.doneListClearAllBorder,
              }}
              onPress={confirmClearDoneList}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>🗑</Text>
              <Text style={{ color: colors.doneListClearAllText, fontWeight: '600', fontSize: 15 }}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoadingDoneList ? (
          <View style={[styles.loadingContainer, { paddingVertical: 48, width: '100%', alignSelf: 'stretch' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text, marginTop: 12 }]}>Loading...</Text>
          </View>
        ) : doneList.length === 0 ? (
          <View
            style={{
              paddingVertical: 48,
              paddingHorizontal: 8,
              alignItems: 'center',
              backgroundColor: theme === 'dark' ? colors.background : '#f8fafc',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: doneCardBorder,
              borderStyle: 'dashed',
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12, color: colors.success || '#16a34a' }}>✓</Text>
            <Text style={[styles.emptyStateText, { color: colors.textMuted, textAlign: 'center' }]}>
              No items yet. Mark cards as done during practice to add them here.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14, width: '100%', alignSelf: 'stretch' }}>
            {doneList.map((entry) => {
              const cardInner = (
                <View
                  style={{
                    backgroundColor: doneCardBg,
                    borderRadius: theme === 'dark' ? 10 : 12,
                    padding: 20,
                    width: '100%',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, width: '100%' }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: colors.text,
                        flex: 1,
                        letterSpacing: -0.3,
                        textAlign: 'left',
                      }}
                      numberOfLines={2}
                    >
                      {entry.name}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: theme === 'dark' ? colors.border : '#f1f5f9',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                        {entry.sortType}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.textSecondary,
                      lineHeight: 22,
                      marginBottom: 12,
                      textAlign: 'left',
                    }}
                    numberOfLines={3}
                  >
                    {entry.meaning}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      marginBottom: 16,
                      textAlign: 'left',
                    }}
                  >
                    {formatMonthLabel(entry.month)} {entry.year}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                      }}
                      onPress={() => handleReturnToPractice(entry.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Return to Practice</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: colors.doneListRemoveBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        Alert.alert(
                          'Remove',
                          `Remove ${entry.name} from done list?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => handleDeleteFromDoneList(entry.id),
                            },
                          ]
                        );
                      }}
                      disabled={deletingDoneId === entry.id}
                      activeOpacity={0.8}
                    >
                      {deletingDoneId === entry.id ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Text style={{ color: colors.doneListRemoveText, fontWeight: '600', fontSize: 14 }}>Remove</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );

              return (
                <View key={entry.id} style={{ width: '100%', alignSelf: 'stretch' }}>
                  {theme === 'dark' ? (
                    <View
                      style={{
                        marginBottom: 14,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.primaryLight,
                        backgroundColor: colors.background,
                        overflow: 'hidden',
                      }}
                    >
                      {cardInner}
                    </View>
                  ) : (
                    <View
                      style={{
                        shadowColor: colors.primary || '#3b82f6',
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.flashcardBorder || '#dbeafe',
                      }}
                    >
                      {cardInner}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderAddFooter = () => (
    <View>
      {listStatus && (
        <Text
          style={[
            styles.feedback,
            listStatus.type === 'error' ? { color: colors.error } : { color: colors.success },
          ]}
        >
          {listStatus.message}
        </Text>
      )}
      {managementMeta && managementMeta.totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { borderColor: colors.rangeButtonBorder, backgroundColor: 'transparent' },
              managementFilters.page === 1 && styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('prev')}
            disabled={managementFilters.page === 1}
          >
            <Text style={[styles.paginationText, { color: colors.rangeButtonText }]}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.paginationMeta, { color: colors.text }]}>
            Page {managementMeta.currentPage} of {managementMeta.totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { borderColor: colors.rangeButtonBorder, backgroundColor: 'transparent' },
              managementMeta.currentPage >= managementMeta.totalPages &&
              styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('next')}
            disabled={managementMeta.currentPage >= managementMeta.totalPages}
          >
            <Text style={[styles.paginationText, { color: colors.rangeButtonText }]}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoadingList && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading vocabulary...</Text>
        </View>
      )}
    </View>
  );

  const renderBulkInsertSection = () => (
    <View style={{ paddingHorizontal: 8 }}>
      {renderBackButton('add', 'Add Vocabulary')}
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Bulk Insert</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 14, marginBottom: 8, fontStyle: 'normal' }]}>
        Upload a .json file or paste JSON. Supports Bangla, English & Unicode.
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: 13, marginBottom: 12, fontStyle: 'normal' }]}>
        Example: [{'{"name": "Love", "meaning": "প্রেম"}'}]
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary, marginBottom: 20 },
          isBulkInserting && styles.disabledButton,
        ]}
        onPress={handleBulkInsertFile}
        disabled={isBulkInserting}
      >
        {isBulkInserting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MaterialIcons name="upload-file" size={22} color="#fff" />
            <Text style={styles.buttonText}>Upload .json file</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Or paste JSON directly</Text>
      <TextInput
        style={[
          styles.input,
          styles.textarea,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.text,
            minHeight: 140,
            textAlignVertical: 'top',
          },
        ]}
        placeholder='[{"name": "Love", "meaning": "প্রেম"}]'
        placeholderTextColor={colors.textMuted}
        multiline
        value={pastedJson}
        onChangeText={setPastedJson}
        editable={!isBulkInserting}
      />
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary, marginTop: 12 },
          isBulkInserting && styles.disabledButton,
        ]}
        onPress={handleBulkInsertPaste}
        disabled={isBulkInserting}
      >
        {isBulkInserting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MaterialIcons name="content-paste" size={22} color="#fff" />
            <Text style={styles.buttonText}>Insert from paste</Text>
          </View>
        )}
      </TouchableOpacity>

      {bulkInsertStatus && (
        <Text
          style={[
            styles.feedback,
            { marginTop: 16 },
            bulkInsertStatus.type === 'error' ? { color: colors.error } : { color: colors.success },
          ]}
        >
          {bulkInsertStatus.message}
        </Text>
      )}
    </View>
  );

  const commonHeader = null;

  if (activeView === 'home') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.heroBg }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'light'} />
        <View style={[styles.heroFull, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, justifyContent: 'center' }}>{renderHome()}</View>
          <Animated.View style={{ opacity: buyMeCoffeeOpacity, transform: [{ translateY: buyMeCoffeeTranslateY }] }}>
            <TouchableOpacity
              style={[styles.buyMeCoffeeLink, { borderColor: colors.primaryLighter }]}
              onPress={() => setActiveView('buyMeACoffee')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="local-cafe" size={20} color="#D4A84B" />
              <Text style={[styles.buyMeCoffeeLinkText, { color: colors.primaryLighter }]}>Buy me a coffee</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (activeView === 'buyMeACoffee') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, flexGrow: 1 }]}>
          {renderBackButton()}
          {renderBuyMeACoffeeSection()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeView === 'bulkInsert') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, flex: 1 }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: colors.background, flexGrow: 1, paddingBottom: 40 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={true}
          >
            {renderBulkInsertSection()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (activeView === 'add') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <FlatList
          data={managementList}
          renderItem={renderVocabItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background, paddingBottom: 40 },
          ]}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 8 }}>
              {commonHeader}
              {renderAddSection()}
              {renderVocabListHeader()}
            </View>
          }
          ListFooterComponent={renderAddFooter()}
          ListEmptyComponent={
            !isLoadingList && (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  No vocabulary yet.
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {activeView !== 'practice' && activeView !== 'doneList' && commonHeader}
          {activeView === 'practice' && renderPracticeSection()}
          {activeView === 'doneList' && renderDoneListSection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    gap: 24,
  },
  headerContainer: {
    marginBottom: 8,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e7ff',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 12,
    color: '#1e40af',
    letterSpacing: -0.5,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  quoteIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  subtitle: {
    flex: 1,
    fontSize: 15,
    color: '#1e3a8a',
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    width: '100%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600', // Semibold for filters
    marginBottom: 6,
    color: '#475569',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24, // Increased from 12 to 24 for more space
    flexWrap: 'wrap',
    width: '100%',
  },
  fullBleed: {
    marginHorizontal: -20,
    width: '100%',
    alignSelf: 'stretch',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 999,
    paddingVertical: 12, // Increased vertical padding for better touch target
    paddingHorizontal: 8, // Reduced horizontal padding to prevent letter clipping
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallChip: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chipText: {
    color: '#475569',
    fontWeight: '500',
  },
  activeChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  activeChipText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    marginBottom: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
  },
  successText: {
    color: '#16a34a',
  },
  practiceArea: {
    marginTop: 16,
    gap: 16,
  },
  flashcardGrid: {
    width: '100%',
    gap: 12,
  },
  flashcardWrapper: {
    width: '100%',
    minHeight: 200,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  filterToggle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  filterToggleText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 15,
  },
  practiceFilters: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 24,
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#eef2ff',
    width: '100%',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  rangeButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  rangeButtonTextActive: {
    color: '#fff',
  },
  practiceNav: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  practiceNavButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  practiceNavPrev: {
    backgroundColor: '#f97316',
  },
  practiceNavNext: {
    backgroundColor: '#a855f7',
  },
  practiceNavText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  filterGroup: {
    marginTop: 24,
    padding: 24,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    width: '100%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearFilters: {
    color: '#dc2626',
    fontWeight: '600',
  },
  heroSafe: {
    backgroundColor: '#1e40af',
  },
  heroFull: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  heroCard: {
    backgroundColor: '#1e40af',
    borderRadius: 32,
    padding: 32,
    gap: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  heroEyebrow: {
    color: '#dbeafe',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#eff6ff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  heroButtons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  primaryCta: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryCta: {
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buyMeCoffeeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 999,
  },
  buyMeCoffeeLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buyMeCoffeeCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 20,
  },
  bmcHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  bmcIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmcTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bmcDescription: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  bmcPaymentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bmcPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bmcMethodIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmcMethodName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bmcNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  bmcNumberText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    flex: 1,
  },
  bmcCopyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  bmcCopyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bmcFooter: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 15,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  editBanner: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editBannerText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  editBannerAction: {
    color: '#dc2626',
    fontWeight: '600',
  },
  savedVocabSection: {
    marginTop: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedVocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedVocabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedVocabTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  savedVocabActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  savedVocabTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  savedVocabTotalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingRight: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  refreshText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  sortOrderButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 36,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32,
  },
  emptyState: {
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 8,
  },
  vocabItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  vocabInfo: {
    marginBottom: 12,
    gap: 4,
  },
  vocabName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  vocabMeaning: {
    color: '#475569',
  },
  vocabMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  vocabActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
  },
  editAction: {
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteAction: {
    color: '#dc2626',
    fontWeight: '600',
  },
  paginationRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationButton: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  paginationText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  paginationMeta: {
    color: '#475569',
    fontWeight: '600',
  },
  meta: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  themeToggleButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  themeToggleIcon: {
    fontSize: 18,
  },
  themeToggleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
