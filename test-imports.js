import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

console.log('All imports loaded successfully!');
console.log('BottomSheet:', BottomSheet);
console.log('BottomSheetBackdrop:', BottomSheetBackdrop);
console.log('BottomSheetView:', BottomSheetView);
console.log('BottomSheetTextInput:', BottomSheetTextInput);