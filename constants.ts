
export const DEFAULT_ENTRY_FILE = 'src/pages/MarketplaceIndex.vue';

export const DEFAULT_FILES: Record<string, string> = {
  'src/pages/MarketplaceIndex.vue': `<script setup lang="ts">
import MarketplaceButtonReset from '~~/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceButtonReset.vue';
import MarketplaceInputSearch from '~~/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceInputSearch.vue';
import MarketplaceSelectorSoftware from '~~/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorSoftware.vue';
import MarketplaceSelectorSortOrder from '~~/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorSortOrder.vue';
import MarketplaceSelectorType from '~~/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorType.vue';
</script>

<template>
  <Sticky limit=".container .inner-wrap">
    <div class="list">
      <ScrollMenu type="intro intro-marketplace">
        <MarketplaceSelectorSoftware />
        <MarketplaceSelectorType />
        <MarketplaceButtonReset />
      </ScrollMenu>

      <div class="filter">
        <MarketplaceSelectorSortOrder />
        <MarketplaceInputSearch />
      </div>
    </div>
  </Sticky>
</template>

<style scoped lang="less">
@import '@/less/solutionUseIndex';
</style>`,

  // --- Stubs for UI components to allow visualization ---
  'src/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceButtonReset.vue': `<script setup lang="ts"></script><template><button>Reset</button></template>`,
  'src/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceInputSearch.vue': `<script setup lang="ts"></script><template><input type="text" /></template>`,
  'src/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorSoftware.vue': `<script setup lang="ts"></script><template><select></select></template>`,
  'src/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorSortOrder.vue': `<script setup lang="ts"></script><template><select>Order</select></template>`,

  // --- Main Logic Component (Refactored from original Marketplace.vue) ---
  'src/layers/4-marketplace/pages/marketplace/features/filter+search/ui/MarketplaceSelectorType.vue': `<script setup lang="ts">
import useFetchMarketplaceCategory from '~/entities/MarketplaceCategory/api/useFetchMarketplaceCategory';
import { useMarketplaceFilter } from '~/model';
import _ from 'lodash';
import { useFetchMarketplaceList } from '~/entities/MarketplaceItem/api/useFetchMarketplaceList';
import { useScreen } from '~/features/useScreen';

const { t: $t } = useI18n();

const { data: categoryListData } = await useFetchMarketplaceCategory();
const { data: marketplaceList } = await useFetchMarketplaceList();

const { screenNow: screenSize } = storeToRefs(useScreen());
const { categoryCode, type } = useMarketplaceFilter();

const isShowDetail = ref(false);

const isDim = (code: string) => {
  return !_.find(marketplaceList.value, (t) => t.categoryCode2 === code);
};

const route = useRoute();
const router = useRouter();

const marketplaceCategory = computed(() => categoryListData.value || []);

const typeClc = computed(() => (!isShowDetail.value && type.value ? 'selected' : ''));

const categoryList = computed(() =>
  marketplaceCategory.value.map((t) => ({
    categoryCode: t.categoryCode1,
    value: t.categoryCode2,
    text: t.categoryCode2Name,
    isDisable: isDim(t.categoryCode2),
  })),
);

const typeList = computed(() => {
  if (!categoryCode.value || categoryCode.value === 'all') return categoryList.value;

  return _.filter(categoryList.value, {
    categoryCode: categoryCode.value,
  });
});

const typeBtnText = computed(
  () => typeList.value?.find((t) => t.value === type.value)?.text ?? $t('marketplace.categoryDetail')
);

function handleSetType(code: string) {
  isShowDetail.value = false;
  router.push({ query: { ...route.query, type: code, page: 1 } });
}
</script>

<template>
  <DropDown v-model="isShowDetail" :clcSet="typeClc">
    <template #btn>
      {{ typeBtnText }}
    </template>

    <template #title>{{ $t('marketplace.categoryDetail') }}</template>

    <template #content>
      <ul class="dropdown-content" :class="{ 'multi-line': screenSize !== 'sm' }">
        <li
          v-for="(item, index) in typeList"
          :key="index"
          class="dropdown-item"
          :class="{
            'dropdown-item-selected': item.value === type,
            'dropdown-item-disabled': item.isDisable,
          }"
        >
          <Check>
            {{ item.text }}
            <input
              v-model="type"
              type="radio"
              :disabled="item.isDisable"
              :value="item.value"
              @change="handleSetType(item.value)"
            />
          </Check>
        </li>
      </ul>
    </template>
  </DropDown>
</template>`,

  'src/model.ts': `import { useRouteQuery } from 'vue-router';

export function useMarketplaceFilter() {
  const categoryCode = useRouteQuery<string>('category', '');
  const type = useRouteQuery<string>('type', '');
  const order = useRouteQuery<string>('order', 'time');
  const searchKey = useRouteQuery<string>('searchKey', '');
  const page = useRouteQuery('page', 1, { transform: Number });

  return new (class {
    categoryCode = categoryCode;
    type = type;
    page = page;
    order = order;
    searchKey = searchKey;
  })();
}`,

  'src/entities/MarketplaceCategory/api/useFetchMarketplaceCategory.ts': `export default function useFetchMarketplaceCategory() {
    const data = ref([]);
    // Mock API call
    return { data };
}`,

  'src/entities/MarketplaceItem/api/useFetchMarketplaceList.ts': `export function useFetchMarketplaceList() {
    const data = ref([]);
    return { data };
}`,

  'src/features/useScreen.ts': `export function useScreen() {
    const screenNow = ref('lg');
    return { screenNow };
}`
};