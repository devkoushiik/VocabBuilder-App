import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,

  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,

} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

import Flashcard from './src/components/Flashcard';
import GradientBorder from './src/components/GradientBorder';
import VocabItem from './src/components/VocabItem';
import { initDatabase } from './src/db/database';
import {
  addVocabulary,
  getVocabulary,
  updateVocabulary,
  deleteVocabulary,
  clearAllVocabulary,
  getFlashcards,
  getAvailableYears,
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

const defaultForm = {
  name: '',
  meaning: '',
  sortType: 'A',
  month: CURRENT_MONTH,
  year: CURRENT_YEAR,
};

const defaultFilters = {
  month: CURRENT_MONTH,
  year: CURRENT_YEAR,
  limit: '5',
  sortType: '',
};

const defaultManagementFilters = {
  page: 1,
  sortType: '',
  month: '',
  year: '',
  search: '',
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

  const isEditing = Boolean(editingId);

  // Animation for filter arrow
  const arrowAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.timing(arrowAnim, {
      toValue: showManagementFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showManagementFilters]);

  const arrowRotation = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });



  // Get current theme colors
  const colors = useMemo(() => theme === 'dark' ? darkTheme : lightTheme, [theme]);

  // Initialize database on app start
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('Initializing local SQLite database...');
        await initDatabase();
        console.log('Database ready!');
        setIsDbReady(true);

        // Check if we need to seed data
        try {
          const { seedDatabase } = require('./src/db/seed');
          const response = await getVocabulary({ limit: 1, page: 1 });

          if (response.data.length === 0) {
            console.log('Database is empty, seeding with sample data...');
            await seedDatabase();
            Alert.alert(
              'Welcome! 🎉',
              'I\'ve added 20 sample English-Bangla vocabulary words to get you started!',
              [{ text: 'Great!' }]
            );
            // Reload list after seeding
            if (activeView === 'add') {
              loadManagementList();
            }
          }
        } catch (seedError) {
          console.log('Skipping seed:', seedError.message);
        }
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

  // Auto-load 5 cards by default when practice view opens
  useEffect(() => {
    if (activeView === 'practice' && !hasAutoLoadedRef.current) {
      hasAutoLoadedRef.current = true;
      // Auto-load after a short delay to ensure view is ready
      const timer = setTimeout(() => {
        handleLoadFlashcards();
      }, 300);
      return () => clearTimeout(timer);
    }
    // Reset ref when leaving practice view
    if (activeView !== 'practice') {
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
    setFormStatus({ type: 'success', message: `Editing "${entry.name}"` });
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
      `Delete "${entry.name}"? This cannot be undone.`,
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
      <VocabItem
        entry={item}
        colors={colors}
        theme={theme}
        onEdit={handleEditEntry}
        onDelete={confirmDeleteEntry}
        deletingId={deletingId}
        monthLabel={mLabel}
      />
    );
  }, [colors, theme, deletingId]);

  const renderHome = () => (
    <View style={[styles.heroCard, { backgroundColor: colors.heroBg, borderColor: colors.primaryLight }]}>
      <TouchableOpacity
        style={[styles.themeToggleButton, { zIndex: 50, elevation: 50 }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Text style={styles.themeToggleIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        <Text style={styles.themeToggleText}>{theme === 'dark' ? 'Light' : 'Dark'}</Text>
      </TouchableOpacity>
      <Text style={[styles.heroEyebrow, { color: colors.primaryLighter }]}>Welcome to</Text>
      <Text style={styles.heroTitle}>Vocab Coach</Text>
      <Text style={[styles.heroSubtitle, { color: colors.primaryLighter }]}>
        Build your personal vocabulary deck and practice with flashcards
        anywhere, anytime.
      </Text>
      <View style={styles.heroButtons}>
        <TouchableOpacity
          style={[styles.primaryCta, { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveView('add')}
        >
          <Text style={styles.primaryCtaText}>Add Vocabulary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryCta, { borderColor: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => setActiveView('practice')}
        >
          <Text style={styles.secondaryCtaText}>Practice Flashcards</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('home')}>
      <Text style={[styles.backButtonText, { color: colors.primary }]}>← Home</Text>
    </TouchableOpacity>
  );

  const renderAddSection = () => {
    const cardContent = (
      <View>
        {renderBackButton()}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Vocabulary</Text>
        {isEditing && (
          <View style={[styles.editBanner, { backgroundColor: theme === 'dark' ? colors.surface : '#dbeafe' }]}>
            <Text style={[styles.editBannerText, { color: theme === 'dark' ? colors.text : '#1d4ed8' }]}>
              Editing "{form.name || 'Vocabulary'}"
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
          style={[styles.button, isSaving && styles.disabledButton]}
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
              borderRadius: theme === 'dark' ? 16 : 12,
              padding: 0,
              marginTop: 0,
            },
          ]}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
              }}
              onPress={() => setShowManagementFilters((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={[styles.listTitle, { fontSize: 16, color: colors.text, paddingRight: 0 }]}>
                Search & Filters
              </Text>
              <Animated.Text
                style={{
                  color: theme === 'dark' ? colors.text : '#0369a1',
                  fontSize: 16,
                  fontWeight: 'bold',
                  transform: [{ rotate: arrowRotation }],
                }}
              >
                ▼
              </Animated.Text>
            </TouchableOpacity>

            {showManagementFilters && (
              <View style={{ padding: 16, paddingTop: 0 }}>
                <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
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
                    <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={managementFilters.sortType}
                        onValueChange={(value) => handleManagementFilterChange('sortType', value)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="All" value="" color={theme === 'dark' ? colors.text : undefined} />
                        {SORT_OPTIONS.map((option) => (
                          <Picker.Item
                            key={`manage-sort-${option}`}
                            label={option}
                            value={option}
                            color={theme === 'dark' ? colors.text : undefined}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={managementFilters.month}
                        onValueChange={(value) => handleManagementFilterChange('month', value)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="All" value="" color={theme === 'dark' ? colors.text : undefined} />
                        {MONTHS.map((month) => (
                          <Picker.Item
                            key={`manage-month-${month.value}`}
                            label={month.label}
                            value={month.value}
                            color={theme === 'dark' ? colors.text : undefined}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={managementFilters.year}
                        onValueChange={(value) => handleManagementFilterChange('year', value)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="All" value="" color={theme === 'dark' ? colors.text : undefined} />
                        {availableYears.map((year) => (
                          <Picker.Item
                            key={`manage-year-${year}`}
                            label={year}
                            value={year}
                            color={theme === 'dark' ? colors.text : undefined}
                          />
                        ))}
                      </Picker>
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
    <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
      <View style={[styles.listHeader, { paddingHorizontal: 0 }]}>
        <Text style={[styles.listTitle, { color: colors.text }]}>Saved Vocabulary</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.clearAllButton,
              { borderColor: colors.error, backgroundColor: theme === 'dark' ? 'transparent' : '#fee2e2' },
              (isDeletingAll || isLoadingList || !managementMeta?.grandTotal) && styles.disabledButton,
            ]}
            onPress={() => {
              confirmDeleteAll();
            }}
            disabled={isDeletingAll || isLoadingList || !managementMeta?.grandTotal}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDeletingAll ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={[styles.clearAllButtonIcon, { color: colors.error }]}>🗑️</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
      <Text style={{ fontSize: 13, color: colors.success, fontWeight: '600', marginTop: -4, marginBottom: 12 }}>
        Total Vocabulary: {managementMeta?.grandTotal || 0}
      </Text>
    </View>
  );

  const renderPracticeSection = () => {
    const cardContent = (
      <View style={[{ backgroundColor: colors.card, borderRadius: 12, padding: 0 }]}>
        <View style={{ padding: 20, paddingBottom: 0 }}>
          {renderBackButton()}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Practice Flashcards</Text>
          <TouchableOpacity
            style={[styles.filterToggle, { backgroundColor: theme === 'dark' ? colors.surface : '#e0f2fe' }]}
            onPress={() => setShowPracticeFilters((prev) => !prev)}
          >
            <Text style={[styles.filterToggleText, { color: theme === 'dark' ? colors.text : '#0369a1' }]}>
              {showPracticeFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
          </TouchableOpacity>

          {showPracticeFilters && (
            <View style={styles.fullBleed}>
              <View
                style={[
                  styles.practiceFilters,
                  {
                    backgroundColor: colors.filterBg,
                    borderColor: colors.border,
                    borderRadius: theme === 'dark' ? 16 : 12,
                  },
                ]}
              >
                <Text style={[styles.label, { color: colors.text }]}>Sort Filter</Text>
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <Picker
                    selectedValue={filters.sortType}
                    onValueChange={(value) => handleFilterChange('sortType', value)}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="All Letters" value="" color={theme === 'dark' ? colors.text : undefined} />
                    {SORT_OPTIONS.map((option) => (
                      <Picker.Item
                        key={`filter-sort-${option}`}
                        label={option}
                        value={option}
                        color={theme === 'dark' ? colors.text : undefined}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={filters.month}
                        onValueChange={(value) => handleFilterChange('month', value)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="Any" value="" color={theme === 'dark' ? colors.text : undefined} />
                        {MONTHS.map((month) => (
                          <Picker.Item
                            key={`filter-month-${month.value}`}
                            label={month.label}
                            value={month.value}
                            color={theme === 'dark' ? colors.text : undefined}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.half}>
                    <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                      <Picker
                        selectedValue={filters.year}
                        onValueChange={(value) => handleFilterChange('year', value)}
                        style={{ color: colors.text }}
                      >
                        <Picker.Item label="Any" value="" color={theme === 'dark' ? colors.text : undefined} />
                        {availableYears.map((year) => (
                          <Picker.Item key={`filter-year-${year}`} label={year} value={year} color={theme === 'dark' ? colors.text : undefined} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Range (cards per session)</Text>
          <View style={styles.rangeRow}>
            {[5, 10, 15].map((value) => (
              <TouchableOpacity
                key={`range-${value}`}
                style={[
                  styles.rangeButton,
                  filters.limit === String(value) && styles.rangeButtonActive,
                  isLoadingCards && styles.disabledButton,
                ]}
                onPress={() => handleQuickRange(value)}
                disabled={isLoadingCards}
              >
                {isLoadingCards && filters.limit === String(value) ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.rangeButtonText,
                      filters.limit === String(value) && styles.rangeButtonTextActive,
                    ]}
                  >
                    {value} cards
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {practiceStatus && (
            <Text
              style={[
                styles.feedback,
                practiceStatus.type === 'error'
                  ? { color: colors.error }
                  : { color: colors.success },
              ]}
            >
              {practiceStatus.message}
            </Text>
          )}
        </View>

        {isLoadingCards ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading flashcards...</Text>
          </View>
        ) : allFlashcards.length > 0 ? (
          <View style={styles.practiceArea}>
            <View style={styles.flashcardGrid}>
              {currentPageFlashcards.map((card, idx) => (
                <View
                  key={card.id || `${card.name}-${card.year}-${idx}`}
                  style={[
                    styles.flashcardWrapper,
                    theme === 'dark' && {
                      padding: 10,
                      borderRadius: 12,
                    },
                  ]}
                >
                  <Flashcard card={card} theme={colors} themeMode={theme} />
                </View>
              ))}
            </View>
            <View style={{ padding: 20, paddingTop: 0 }}>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Showing {currentPageFlashcards.length} of {allFlashcards.length} cards
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </Text>
              {totalPages > 1 && (
                <View style={styles.practiceNav}>
                  <TouchableOpacity
                    style={[
                      styles.practiceNavButton,
                      styles.practiceNavPrev,
                      (currentCardIndex === 0 || isLoadingCards) && styles.disabledButton,
                    ]}
                    onPress={handlePrevPage}
                    disabled={currentCardIndex === 0 || isLoadingCards}
                  >
                    <Text style={styles.practiceNavText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.practiceNavButton,
                      styles.practiceNavNext,
                      (currentCardIndex >= totalPages - 1 || isLoadingCards) &&
                      styles.disabledButton,
                    ]}
                    onPress={handleNextPage}
                    disabled={currentCardIndex >= totalPages - 1 || isLoadingCards}
                  >
                    <Text style={styles.practiceNavText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              No flashcards available. Adjust filters or load data.
            </Text>
          </View>
        )}
      </View>
    );

    // Wrap with gradient border in dark mode
    if (theme === 'dark') {
      return (
        <GradientBorder
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          borderRadius={12}
        >
          {cardContent}
        </GradientBorder>
      );
    }

    return <View style={[styles.card, { backgroundColor: colors.card, borderRadius: 12 }]}>{cardContent}</View>;
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
              { borderColor: colors.border },
              managementFilters.page === 1 && styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('prev')}
            disabled={managementFilters.page === 1}
          >
            <Text style={[styles.paginationText, { color: colors.text }]}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.paginationMeta, { color: colors.text }]}>
            Page {managementMeta.currentPage} of {managementMeta.totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { borderColor: colors.border },
              managementMeta.currentPage >= managementMeta.totalPages &&
              styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('next')}
            disabled={managementMeta.currentPage >= managementMeta.totalPages}
          >
            <Text style={[styles.paginationText, { color: colors.text }]}>Next</Text>
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

  const commonHeader = (
    <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Vocabulary Builder</Text>
      <View style={[styles.quoteContainer, { backgroundColor: colors.quoteBg, borderLeftColor: colors.primary }]}>
        <Text style={styles.quoteIcon}>💬</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{randomQuote}</Text>
      </View>
    </View>
  );

  if (activeView === 'home') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.heroBg }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'light'} />
        <View style={styles.heroFull}>{renderHome()}</View>
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
            <View>
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
          {commonHeader}
          {activeView === 'practice' && renderPracticeSection()}
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
    padding: 20,
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#eef2ff',
    width: '100%',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rangeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 24,
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
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  primaryCta: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
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
    borderColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
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
    paddingHorizontal: 12,
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
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32,
  },
  clearAllButtonIcon: {
    fontSize: 20,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 12,
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
