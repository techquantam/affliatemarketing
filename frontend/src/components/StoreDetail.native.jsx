import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Linking } from 'react-native';
import { ArrowLeft, Clock, Copy, Check, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react-native';
import { getStoreUrl } from '../utils/openUrl';

export default function StoreDetail({ store, onBack, onAddNotification, theme, deals = [], onGrabDeal }) {
  const [copiedCouponId, setCopiedCouponId] = useState(null);
  const [activatingDealId, setActivatingDealId] = useState(null);

  const isDark = theme === 'dark';
  const themeStyles = {
    container: {
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
    },
    card: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#1f2937' : '#e5e7eb',
      borderWidth: isDark ? 1 : 0,
    },
    text: {
      color: isDark ? '#f3f4f6' : '#111827',
    },
    textMuted: {
      color: isDark ? '#9ca3af' : '#4b5563',
    },
    backBtn: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#1f2937' : '#e5e7eb',
    },
    couponAction: {
      backgroundColor: isDark ? '#161e2e' : '#fafafa',
      borderTopColor: isDark ? '#1f2937' : '#f3f4f6',
    },
    couponCard: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#1f2937' : '#e5e7eb',
    },
    borderTop: {
      borderTopColor: isDark ? '#1f2937' : '#f3f4f6',
    }
  };

  const handleCopyCode = async (coupon) => {
    if (coupon.code) {
      try {
        await Share.share({
          message: `Coupon Code for ${store.name}: ${coupon.code}`,
        });
        setCopiedCouponId(coupon.id);
        onAddNotification(`Coupon code "${coupon.code}" shared!`, 'success');
        
        const targetUrl = coupon.link || store.affiliateUrl || store.link || getStoreUrl(store.name);
        setTimeout(() => {
          setCopiedCouponId(null);
          Linking.openURL(targetUrl).catch(() => Linking.openURL('https://google.com'));
        }, 1200);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleActivateDeal = (coupon) => {
    setActivatingDealId(coupon.id);
    onAddNotification(`Activating ${store.cashbackRate} Cashback Tracker...`, 'success');
    
    const targetUrl = coupon.link || store.affiliateUrl || store.link || getStoreUrl(store.name);
    setTimeout(() => {
      setActivatingDealId(null);
      Linking.openURL(targetUrl).catch(() => Linking.openURL('https://google.com'));
    }, 800);
  };

  return (
    <ScrollView
      style={[styles.container, themeStyles.container]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      stickyHeaderIndices={[0]}
    >
      {/* Sticky Back navigation */}
      <View style={{ backgroundColor: isDark ? '#090d16' : '#f8fafc', paddingBottom: 8, zIndex: 10 }}>
        <TouchableOpacity style={[styles.backBtn, themeStyles.backBtn]} onPress={onBack}>
          <ArrowLeft size={16} color="#ff4f2f" />
          <Text style={styles.backBtnText}>Back to All Stores</Text>
        </TouchableOpacity>
      </View>

      {/* Store Detailed Banner */}
      <View style={[styles.headerCard, themeStyles.card]}>
        <View style={styles.logoWrapper}>
          <Image source={{ uri: store.logo }} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={[styles.storeName, themeStyles.text]}>{store.name} Coupons</Text>
        
        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackBadgeText}>Up to {store.cashbackRate} Cashback</Text>
        </View>

        <Text style={[styles.storeDesc, themeStyles.textMuted]}>{store.description}</Text>
        
        <View style={[styles.metaRow, themeStyles.borderTop]}>
          <View style={styles.metaItem}>
            <Clock size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.metaText, themeStyles.textMuted]}>Tracks: 24 - 48 Hours</Text>
          </View>
          <View style={styles.metaItem}>
            <Sparkles size={12} color="#10b981" />
            <Text style={[styles.metaText, themeStyles.textMuted]}>Payout: ~60 days</Text>
          </View>
        </View>
      </View>

      {/* Coupons Header */}
      <Text style={[styles.sectionTitle, themeStyles.text]}>Active Coupons & Deals ({store.coupons ? store.coupons.length : 0})</Text>

      {/* Coupons List */}
      <View style={styles.couponsList}>
        {store.coupons && store.coupons.map((coupon) => (
          <View key={coupon.id} style={[styles.couponCard, themeStyles.couponCard]}>
            <View style={styles.couponMain}>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, coupon.code ? styles.codeBadge : styles.dealBadge]}>
                  <Text style={[styles.typeBadgeText, { color: coupon.code ? '#2563eb' : '#10b981' }]}>
                    {coupon.code ? 'COUPON CODE' : 'VERIFIED DEAL'}
                  </Text>
                </View>
                <Text style={styles.expiryText}>Exp: {coupon.expiry}</Text>
              </View>
              <Text style={[styles.couponTitle, themeStyles.text]}>{coupon.title}</Text>
              <Text style={[styles.couponDesc, themeStyles.textMuted]}>{coupon.description}</Text>
            </View>

            <View style={[styles.couponAction, themeStyles.couponAction]}>
              {coupon.code ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.codeBtn, copiedCouponId === coupon.id && styles.copiedBtn]}
                  onPress={() => handleCopyCode(coupon)}
                >
                  <Text style={[styles.actionBtnText, copiedCouponId === coupon.id ? { color: '#10b981' } : styles.codeBtnText]}>
                    {copiedCouponId === coupon.id ? 'Copied' : `Use Code: ${coupon.code}`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.dealBtn]}
                  onPress={() => handleActivateDeal(coupon)}
                >
                  <Text style={styles.actionBtnText}>
                    {activatingDealId === coupon.id ? 'Tracking...' : 'Activate Deal'}
                  </Text>
                  <ExternalLink size={12} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Deals Section */}
      {deals && deals.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, themeStyles.text, { marginBottom: 12 }]}>Featured Products & Deals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsScroll}>
            {deals.map((deal) => {
              const discountPercent = Math.round(((deal.retailPrice - deal.dealPrice) / deal.retailPrice) * 100) || 33;
              const finalEffectivePrice = (deal.dealPrice - deal.cashbackEarned).toFixed(2);
              return (
                <TouchableOpacity key={deal.id} style={[styles.homeDealCard, themeStyles.card]} onPress={() => onGrabDeal && onGrabDeal(deal)}>
                  <View style={styles.dealDiscountTag}>
                    <Text style={styles.dealDiscountTagText}>{discountPercent}% OFF</Text>
                  </View>
                  <Image source={{ uri: deal.image }} style={styles.homeDealImage} resizeMode="contain" />
                  <View style={styles.homeDealInfo}>
                    <Text style={[styles.homeDealTitle, themeStyles.text]} numberOfLines={1}>{deal.title}</Text>
                    <View style={styles.homeDealPrices}>
                      <Text style={[styles.homeDealRetail, themeStyles.textMuted]}>₹{deal.retailPrice.toFixed(2)}</Text>
                      <Text style={[styles.homeDealSpecial, themeStyles.text]}>₹{deal.dealPrice.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.homeDealCashback}>+₹{deal.cashbackEarned.toFixed(2)} CB</Text>
                    <View style={styles.homeDealEffectiveRow}>
                      <Text style={styles.homeDealEffectiveLabel}>Effective Price:</Text>
                      <Text style={styles.homeDealEffectiveValue}>₹{finalEffectivePrice}</Text>
                    </View>
                    <TouchableOpacity style={[styles.homeDealGrabBtn, { backgroundColor: '#ff4f2f' }]} onPress={() => onGrabDeal && onGrabDeal(deal)}>
                      <Text style={styles.homeDealGrabBtnText}>Grab Deal</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Guidelines Card */}
      <View style={[styles.guidelinesCard, themeStyles.card]}>
        <Text style={[styles.cardTitle, themeStyles.text]}>How to earn Cashback?</Text>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletSymbol}>•</Text>
          <Text style={[styles.bulletText, themeStyles.textMuted]}>Always start your session by clicking out from LIO MART.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletSymbol}>•</Text>
          <Text style={[styles.bulletText, themeStyles.textMuted]}>Only add items to your cart after clicking out.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletSymbol}>•</Text>
          <Text style={[styles.bulletText, themeStyles.textMuted]}>Do not use external browser coupon plug-ins or extensions.</Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletSymbol}>•</Text>
          <Text style={[styles.bulletText, themeStyles.textMuted]}>Complete the transaction in a single session within 2 hours.</Text>
        </View>
      </View>

      {/* Terms Card */}
      <View style={[styles.termsCard, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <ShieldAlert size={16} color="#ef4444" />
          <Text style={[styles.cardTitle, { color: '#ef4444', marginBottom: 0 }]}>Important Terms</Text>
        </View>
        <Text style={[styles.termsText, isDark && { color: '#fca5a5' }]}>
          Cashback is not paid on bulk purchases, wholesale transactions, or cancelled/returned orders.
          Cashback tracking may take up to 48 hours to display as "Pending" in your LIO MART wallet.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff4f2f',
  },
  headerCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoWrapper: {
    width: 80,
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cashbackBadge: {
    backgroundColor: 'rgba(255, 79, 47, 0.08)',
    borderWidth: 1,
    borderColor: '#ff4f2f',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  cashbackBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff4f2f',
  },
  storeDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 10,
    width: '100%',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  couponsList: {
    gap: 12,
    marginBottom: 20,
  },
  couponCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  couponMain: {
    padding: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  codeBadge: {
    backgroundColor: '#eff6ff',
  },
  dealBadge: {
    backgroundColor: '#ecfdf5',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  expiryText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  couponDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  couponAction: {
    borderTopWidth: 1,
    padding: 10,
  },
  actionBtn: {
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  codeBtn: {
    backgroundColor: 'rgba(255, 79, 47, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 47, 0.3)',
  },
  copiedBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  dealBtn: {
    backgroundColor: '#ff4f2f',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  codeBtnText: {
    color: '#ff4f2f',
  },
  guidelinesCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletSymbol: {
    fontSize: 12,
    marginRight: 6,
    color: '#ff4f2f',
    fontWeight: '700',
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 15,
  },
  termsCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 11,
    color: '#991b1b',
    lineHeight: 15,
  },
  dealsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  homeDealCard: {
    width: 170,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dealDiscountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4f2f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  dealDiscountTagText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  homeDealImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
  },
  homeDealInfo: {
    gap: 2,
  },
  homeDealTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  homeDealPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeDealRetail: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  homeDealSpecial: {
    fontSize: 12,
    fontWeight: '800',
  },
  homeDealCashback: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  homeDealEffectiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
    marginTop: 4,
  },
  homeDealEffectiveLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  homeDealEffectiveValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ff4f2f',
  },
  homeDealGrabBtn: {
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
    marginTop: 6,
  },
  homeDealGrabBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
