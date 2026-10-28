import sourdough1536 from '../assets/recipes/sourdough-1536.webp';
import sourdough768 from '../assets/recipes/sourdough-768.webp';
import pizza1536 from '../assets/recipes/pizza-1536.webp';
import pizza768 from '../assets/recipes/pizza-768.webp';
import focaccia1536 from '../assets/recipes/focaccia-1536.webp';
import focaccia768 from '../assets/recipes/focaccia-768.webp';
import raisin1536 from '../assets/recipes/raisin-bread-1536.webp';
import raisin768 from '../assets/recipes/raisin-bread-768.webp';
import buns1536 from '../assets/recipes/hot-cross-buns-1536.webp';
import buns768 from '../assets/recipes/hot-cross-buns-768.webp';

export interface RecipePhoto {
  src: string;
  srcSet: string;
  alt: string;
}

const photo = (small: string, large: string, alt: string): RecipePhoto => ({ src: large, srcSet: `${small} 768w, ${large} 1536w`, alt });

/** Still-life photos of each recipe's ingredients (AI-generated; not the finished bake). Missing ids simply show no photo. */
export const RECIPE_PHOTOS: Record<string, RecipePhoto> = {
  classic_sourdough: photo(sourdough768, sourdough1536, 'Sourdough starter in a jar, a bowl of flour, a linen-lined proofing basket, a water jug, salt and a bench scraper on a stone bench.'),
  poolish_pizza: photo(pizza768, pizza1536, 'A bowl of bubbly poolish under linen, flour, salt, barley malt and olive oil, with a wooden pizza peel behind.'),
  bens_focaccia: photo(focaccia768, focaccia1536, 'An oiled roasting tray beside olive oil, flaky salt, rosemary, cherry tomatoes, olives and a bowl of flour.'),
  bens_raisin_bread: photo(raisin768, raisin1536, 'A lidded loaf tin with sultanas, malt extract, cinnamon, an orange and fresh zest, and a bowl of flour.'),
  hot_cross_buns: photo(buns768, buns1536, 'Flour, raisins, currants, an orange, eggs, butter, spices, a nutmeg with a grater and apricot jam on a stone bench.'),
};
