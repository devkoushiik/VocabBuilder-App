import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  createVocabulary,
  deleteVocabulary,
  fetchFlashcards,
  fetchVocabulary,
  updateVocabulary,
} from './src/services/api';
import {
  validatePracticeFilters,
  validateVocabularyForm,
} from './src/utils/validators';

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
const YEARS = Array.from({ length: 201 }, (_, idx) => `${1900 + idx}`);

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
  const [listStatus, setListStatus] = useState(null);
  const [managementFilters, setManagementFilters] = useState(
    defaultManagementFilters
  );
  const [managementMeta, setManagementMeta] = useState(null);
  const [showPracticeFilters, setShowPracticeFilters] = useState(false);
  const [randomQuote, setRandomQuote] = useState(getRandomQuote());

  const isEditing = Boolean(editingId);

  const loadManagementList = useCallback(async () => {
    setListStatus(null);
    setIsLoadingList(true);
    try {
      const response = await fetchVocabulary({
        ...managementFilters,
        limit: MANAGEMENT_LIMIT,
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
    if (activeView === 'add') {
      loadManagementList();
    }
  }, [activeView, loadManagementList]);

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
        await createVocabulary(payload);
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

  const handleLoadFlashcards = async () => {
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

    // Build base params - fetch batches of up to 50 items (API max)
    const baseParams = {
      limit: 50,
    };

    // Only add optional filters if they have values
    if (filters.sortType && filters.sortType.trim() !== '') {
      baseParams.sortType = filters.sortType.trim();
    }
    
    if (filters.month && filters.month !== '') {
      const monthNum = Number(filters.month);
      if (!Number.isNaN(monthNum)) {
        baseParams.month = monthNum;
      }
    }
    
    if (filters.year && filters.year !== '') {
      const yearNum = Number(filters.year);
      if (!Number.isNaN(yearNum)) {
        baseParams.year = yearNum;
      }
    }

    try {
      setIsLoadingCards(true);
      const aggregated = [];
      let page = 1;
      let totalPagesFromApi = 1;

      do {
        const response = await fetchFlashcards({ ...baseParams, page });
        const batch = response.data || [];
        aggregated.push(...batch);
        totalPagesFromApi = response?.meta?.totalPages || 1;
        if (batch.length === 0 || page >= totalPagesFromApi) {
          break;
        }
        page += 1;
      } while (page <= totalPagesFromApi);

      const allData = aggregated;
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
  };

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
    setEditingId(entry._id);
    setFormStatus({ type: 'success', message: `Editing "${entry.name}"` });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormStatus(null);
  };

  const handleDeleteEntry = async (id) => {
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
          onPress: () => handleDeleteEntry(entry._id),
        },
      ]
    );
  };

  const renderHome = () => (
    <View style={styles.heroCard}>
      <Text style={styles.heroEyebrow}>Welcome to</Text>
      <Text style={styles.heroTitle}>Vocab Coach</Text>
      <Text style={styles.heroSubtitle}>
        Build your personal vocabulary deck and practice with flashcards
        anywhere, anytime.
      </Text>
      <View style={styles.heroButtons}>
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => setActiveView('add')}
        >
          <Text style={styles.primaryCtaText}>Add Vocabulary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryCta}
          onPress={() => setActiveView('practice')}
        >
          <Text style={styles.secondaryCtaText}>Practice Flashcards</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('home')}>
      <Text style={styles.backButtonText}>← Home</Text>
    </TouchableOpacity>
  );

  const renderAddSection = () => (
    <View style={styles.card}>
      {renderBackButton()}
      <Text style={styles.sectionTitle}>Add Vocabulary</Text>
      {isEditing && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            Editing “{form.name || 'Vocabulary'}”
          </Text>
          <TouchableOpacity onPress={handleCancelEdit}>
            <Text style={styles.editBannerAction}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Vocabulary"
        value={form.name}
        onChangeText={(value) => handleInputChange('name', value)}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Meaning"
        multiline
        value={form.meaning}
        onChangeText={(value) => handleInputChange('meaning', value)}
      />
      <Text style={styles.label}>Sort Type</Text>
      <View style={[styles.chipRow, styles.wrap]}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, form.sortType === option && styles.activeChip]}
            onPress={() => handleInputChange('sortType', option)}
          >
            <Text
              style={[
                styles.chipText,
                form.sortType === option && styles.activeChipText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Month</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.month}
              onValueChange={(value) => handleInputChange('month', value)}
            >
              <Picker.Item label="Select month" value="" />
              {MONTHS.map((month) => (
                <Picker.Item
                  key={`month-${month.value}`}
                  label={month.label}
                  value={month.value}
                />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Year</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.year}
              onValueChange={(value) => handleInputChange('year', value)}
            >
              <Picker.Item label="Select year" value="" />
              {YEARS.map((year) => (
                <Picker.Item key={`year-${year}`} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {formStatus && (
        <Text
          style={[
            styles.feedback,
            formStatus.type === 'error' ? styles.errorText : styles.successText,
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

      <View style={styles.filterGroup}>
        <View style={styles.filterHeader}>
          <Text style={styles.listTitle}>Search & Filter</Text>
          <TouchableOpacity onPress={handleResetManagementFilters}>
            <Text style={styles.clearFilters}>Reset</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Search vocabulary"
          value={managementFilters.search}
          onChangeText={(value) => handleManagementFilterChange('search', value)}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Sort Filter</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={managementFilters.sortType}
                onValueChange={(value) =>
                  handleManagementFilterChange('sortType', value)
                }
              >
                <Picker.Item label="All Letters" value="" />
                {SORT_OPTIONS.map((option) => (
                  <Picker.Item
                    key={`manage-sort-${option}`}
                    label={option}
                    value={option}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Month</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={managementFilters.month}
                onValueChange={(value) =>
                  handleManagementFilterChange('month', value)
                }
              >
                <Picker.Item label="Any" value="" />
                {MONTHS.map((month) => (
                  <Picker.Item
                    key={`manage-month-${month.value}`}
                    label={month.label}
                    value={month.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={managementFilters.year}
                onValueChange={(value) =>
                  handleManagementFilterChange('year', value)
                }
              >
                <Picker.Item label="Any" value="" />
                {YEARS.map((year) => (
                  <Picker.Item
                    key={`manage-year-${year}`}
                    label={year}
                    value={year}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Saved Vocabulary</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadManagementList}
          disabled={isLoadingList}
        >
          <Text style={styles.refreshText}>
            {isLoadingList ? 'Refreshing…' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingList ? (
        <ActivityIndicator color="#2563eb" />
      ) : managementList.length === 0 ? (
        <Text style={styles.emptyState}>No vocabulary yet.</Text>
      ) : (
        managementList.map((entry) => (
          <View key={entry._id} style={styles.vocabItem}>
            <View style={styles.vocabInfo}>
              <Text style={styles.vocabName}>{entry.name}</Text>
              <Text style={styles.vocabMeaning}>{entry.meaning}</Text>
              <Text style={styles.vocabMeta}>
                {formatMonthLabel(entry.month)} {entry.year} • Sort {entry.sortType}
              </Text>
            </View>
            <View style={styles.vocabActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditEntry(entry)}
              >
                <Text style={styles.editAction}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => confirmDeleteEntry(entry)}
                disabled={deletingId === entry._id}
              >
                {deletingId === entry._id ? (
                  <ActivityIndicator color="#dc2626" />
                ) : (
                  <Text style={styles.deleteAction}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {listStatus && (
        <Text
          style={[
            styles.feedback,
            listStatus.type === 'error' ? styles.errorText : styles.successText,
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
              managementFilters.page === 1 && styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('prev')}
            disabled={managementFilters.page === 1}
          >
            <Text style={styles.paginationText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.paginationMeta}>
            Page {managementMeta.currentPage} of {managementMeta.totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              managementMeta.currentPage >= managementMeta.totalPages &&
                styles.disabledButton,
            ]}
            onPress={() => handleManagementPageChange('next')}
            disabled={managementMeta.currentPage >= managementMeta.totalPages}
          >
            <Text style={styles.paginationText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPracticeSection = () => (
    <View style={styles.card}>
      {renderBackButton()}
      <Text style={styles.sectionTitle}>Practice Flashcards</Text>
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowPracticeFilters((prev) => !prev)}
      >
        <Text style={styles.filterToggleText}>
          {showPracticeFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {showPracticeFilters && (
        <View style={styles.practiceFilters}>
          <Text style={styles.label}>Sort Filter</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.sortType}
              onValueChange={(value) => handleFilterChange('sortType', value)}
            >
              <Picker.Item label="All Letters" value="" />
              {SORT_OPTIONS.map((option) => (
                <Picker.Item
                  key={`filter-sort-${option}`}
                  label={option}
                  value={option}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Month</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.month}
                  onValueChange={(value) => handleFilterChange('month', value)}
                >
                  <Picker.Item label="Any" value="" />
                  {MONTHS.map((month) => (
                    <Picker.Item
                      key={`filter-month-${month.value}`}
                      label={month.label}
                      value={month.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.year}
                  onValueChange={(value) => handleFilterChange('year', value)}
                >
                  <Picker.Item label="Any" value="" />
                  {YEARS.map((year) => (
                    <Picker.Item key={`filter-year-${year}`} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.label}>Range (cards per session)</Text>
      <View style={styles.rangeRow}>
        {[5, 10, 15].map((value) => (
          <TouchableOpacity
            key={`range-${value}`}
            style={[
              styles.rangeButton,
              filters.limit === String(value) && styles.rangeButtonActive,
            ]}
            onPress={() => handleQuickRange(value)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                filters.limit === String(value) && styles.rangeButtonTextActive,
              ]}
            >
              {value} cards
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {practiceStatus && (
        <Text
          style={[
            styles.feedback,
            practiceStatus.type === 'error'
              ? styles.errorText
              : styles.successText,
          ]}
        >
          {practiceStatus.message}
        </Text>
      )}

      {allFlashcards.length > 0 && (
        <View style={styles.practiceArea}>
          <View style={styles.flashcardGrid}>
            {currentPageFlashcards.map((card, idx) => (
              <View
                key={card._id || `${card.name}-${card.year}-${idx}`}
                style={styles.flashcardWrapper}
              >
                <Flashcard card={card} />
              </View>
            ))}
          </View>
          <Text style={styles.meta}>
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
      )}
    </View>
  );

  if (activeView === 'home') {
    return (
      <SafeAreaView style={[styles.safe, styles.heroSafe]}>
        <StatusBar style="light" />
        <View style={styles.heroFull}>{renderHome()}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Vocabulary Builder</Text>
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteIcon}>💬</Text>
              <Text style={styles.subtitle}>{randomQuote}</Text>
            </View>
          </View>
          {activeView === 'add' && renderAddSection()}
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
    borderRadius: 20,
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
    fontWeight: '500',
    marginBottom: 6,
    color: '#475569',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
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
    gap: 16,
  },
  flashcardWrapper: {
    width: '100%',
  },
  filterToggle: {
    alignSelf: 'flex-end',
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  filterToggleText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  practiceFilters: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#eef2ff',
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
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
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  refreshText: {
    color: '#475569',
    fontWeight: '600',
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
});
