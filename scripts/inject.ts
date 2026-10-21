import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
let cleanUrl = rawUrl.replace(/^VITE_/, '').replace(/\/rest\/v1\/?$/, '');
let cleanKey = rawKey.replace(/^VITE_/, '');

const supabase = createClient(cleanUrl, cleanKey);

const sqlMapping: Record<string, string> = {
  // SOUPS
  'Abardeen Angus Oxtail': 'A rich, slow-simmered oxtail broth prepared with tender beef, root vegetables, herbs, and aromatic spices, finished with a deep, hearty flavor.',
  'Beef Consommé': 'A crystal-clear, delicately seasoned beef broth prepared from slow-cooked beef bones and vegetables for a refined and comforting starter.',
  'Chicken Consommé': 'A light yet flavorful chicken broth infused with fresh herbs and vegetables, offering a clean and elegant taste.',
  'Minestrone': 'A rustic Italian vegetable soup featuring seasonal vegetables, beans, herbs, and pasta simmered in a rich tomato broth.',
  'Tomato Soup': 'Velvety ripe tomatoes blended with herbs and cream to create a smooth, comforting classic.',
  'Potato & Leek Soup': 'Creamy potatoes and sweet leeks gently simmered and blended into a rich, warming soup.',
  'Mushroom Soup': 'Fresh mushrooms sautéed with herbs and cream, creating a smooth soup with earthy flavors.',
  'Kenyan Gumbo': 'A hearty African-inspired soup combining vegetables, herbs, and spices in a rich, comforting broth.',

  // STARTERS & TAPAS
  'MacClaymount\'s Chicken/Beef/Pork Kilted Pancake': 'Tender diced chicken, beef, or pork stir-fried with seasoned vegetables, wrapped in a savory pancake and served with your choice of barbecue or Hollandaise sauce.',
  'MacWaltrick\'s Spring Roll': 'Golden crispy pastry rolls filled with seasoned chicken or fresh vegetables, served hot and crunchy.',
  'MacWalties Samosas': 'A Kenyan favorite featuring flaky pastry parcels filled with spiced beef, chicken, lamb, or vegetables and fried to perfection.',
  'MacTavish Assorted Cheese Platter': 'A selection of fine cheeses served with crispy crackers, gherkins, and onion rings.',
  'MacSporan\'s Masala Chips': 'Crispy French fries tossed in aromatic East African masala spices for a bold, flavorful kick.',
  'MacColl\'s Plain Chips': 'Golden hand-cut fries cooked until crisp and lightly seasoned.',
  'Macombie\'s Assorted Tubers Chips': 'A colorful assortment of cassava, sweet potatoes, arrowroots, and Irish potatoes fried until golden and crunchy.',
  'MacCrispies Papadums': 'Light and crispy Indian-style lentil wafers served as a crunchy accompaniment or snack.',

  // SANDWICH BAR
  'MacBull Angus Beef Sandwich': 'Thinly sliced Angus beef layered with cheese and served in your choice of fresh white or brown bread.',
  'MacGregor\'s Ham Sandwich': 'Premium country ham served on freshly baked bread with crisp salad garnish.',
  'MacClarence\'s Club Sandwich': 'A hearty triple-layer sandwich stacked with bacon, ham, cheese, chicken or beef, lettuce, and tomatoes.',
  'MacPridge\'s Chicken Sandwich': 'Tender sliced chicken breast served on freshly baked bread with crisp greens.',
  'MacQueen Vegetarian Sandwich': 'Fresh tomatoes, onions, and lettuce served on your choice of white or brown bread.',
  'MacBeth Vegetarian Tofu Sandwich': 'Marinated tofu layered with carrots, cabbage, onions, pickled cucumber, and fresh lettuce.',

  // BURGER CORNER
  'MacDonalds Quarter Pounder': 'A juicy quarter-pound Angus beef patty topped with cheese, tomatoes, onions, pickles, and cucumber in a freshly baked roll.',
  'Mac Tavish Quarter Pounder': 'Grilled chicken breast topped with melted cheese and fresh vegetables in a soft roll.',
  'MacKenzie Vegetarian Burger': 'A seasoned tofu patty topped with tomatoes, onions, and pickled cucumber.',
  'MacTriple Decker Hamburger': 'Three generous layers of beef, chicken, or ham combined with cheese, vegetables, and pickles for the ultimate burger experience.',
  'MacBaker\'s Bread Roll': 'Freshly baked rolls filled with your choice of cheese, ham, sausage, egg, or vegetables. Served with French fries and house sauces.',

  // ABERDEEN ANGUS STEAK SPECIALS
  'Aberdeen Angus Beef Steak "Provacal"': 'Premium Angus sirloin marinated in herbs and spices, grilled to your preference and served with seasonal vegetables.',
  'Aberdeen Angus Beef Fillet "Medallion"': 'Tender beef medallions pan-seared and finished in a delicate red wine reduction.',
  'Aberdeen Angus Beef Fillet "Pepper Sauce"': 'Prime beef fillet cooked to perfection and topped with a rich creamy black pepper and brandy sauce.',
  'Aberdeen Angus T-Bone Steak "Cafe De Paris"': 'A classic T-bone steak enhanced with aromatic Café de Paris butter and grilled to perfection.',
  'Aberdeen Angus Beef Fillet "Karimaindu"': 'Tender strips of Angus fillet stir-fried and tossed with fresh Kenyan kachumbari salsa. Served with fries and choice of sauce.',

  // ITALIAN PASTA
  'Spaghetti Bolognaise': 'Classic Italian spaghetti topped with a rich slow-cooked minced beef ragù and finished with Parmesan cheese.',
  'Spaghetti Vegetarian': 'Seasonal vegetables layered with tomato concassé, creamy Mornay sauce, and melted mozzarella cheese.',
  'Lasagna': 'Layers of pasta, seasoned minced beef, creamy béchamel, and mozzarella cheese baked until golden.',
  'Lasagna Vegetarian': 'Layers of roasted vegetables, tomato concassé, Mornay sauce, and mozzarella cheese baked to perfection.',

  // CHICKEN SPECIALTIES
  'Chicken Wings or Drumsticks': 'Marinated chicken coated in a tangy sweet-and-sour glaze with a hint of spice.',
  'Chicken Maryland': 'Breaded chicken breast served with sweet banana fritters, maize, and seasonal vegetables.',
  'Chicken à la Kiev': 'Tender chicken breast stuffed with herb and chili butter, coated in breadcrumbs and pan-fried until golden.',
  'Sizzling Chicken Karimaindu': 'Shredded chicken breast stir-fried with fresh kachumbari and served sizzling on a hot cast-iron plate.',

  // LAKE VICTORIA FISH SPECIALTIES
  'MacFies Tilapia ala Kisumu Dala': 'Whole Lake Victoria tilapia marinated with local spices and deep-fried until crisp.',
  'MacPeuson\'s Tilapia/Nile Perch Fillet Nyalgunga': 'Fresh Nile perch fillet pan-seared in chili butter and finished with aromatic herbs.',
  'MacTickels Whole Tilapia': 'Pan-fried whole tilapia finished with a mildly spicy tomato sauce.',
  'MaCatfishs Mudfish/Mumi Ala Kit Mikayi': 'Fresh mudfish simmered in a rich devilled tomato sauce inspired by traditional Luo cuisine.',

  // CURRY POT
  'Butter Chicken': 'Tender chicken pieces cooked in clarified butter, black pepper, and aromatic spices.',
  'Chicken Curry': 'Marinated chicken simmered in a fragrant curry sauce infused with traditional spices.',
  'Lamb Curry': 'Slow-cooked diced lamb in a rich, aromatic curry gravy.',
  'Tilapia Fish Curry': 'Fresh tilapia cooked in a flavorful curry sauce with local herbs and spices. Served with rice, naan, chapati, or chips.',

  // ROOFTOP TERRACE BARBECUE
  'MacDoodle\'s Barbecued Haggis "Mutura"': 'Traditional Kenyan mutura made with seasoned minced meat stuffed into natural casing and charcoal grilled.',
  'MacChristie\'s Barbecued Chicken': 'Quarter chicken marinated in house barbecue sauce and grilled over charcoal.',
  'MacSnorties BBQ Ribs': 'Tender beef, lamb, or pork ribs glazed in barbecue sauce and slow-grilled.',
  'MacKinnonn\'s Skewers': 'Succulent chunks of marinated beef, lamb, or chicken grilled over open flames.',
  'Mixed Grilled (Sokomoko Platter)': 'An abundant sharing platter featuring mutura, chicken, ribs, beef, lamb, and pork. Served with kachumbari, chips, and ugali.',

  // STEAK & CHOPS
  'MacGrants Pork and Chips': 'Juicy pork chops marinated in barbecue sauce and pan-fried in garlic butter.',
  'MacKiddies Tender Lamb': 'Lamb cutlets grilled and served with mint sauce and seasonal vegetables.',
  'MacKinnon\'s Beef or Chicken Skewers': 'Charcoal-grilled skewers of marinated beef or chicken.',
  'MacGoaties Molo Lamb': 'Whole roasted leg of lamb marinated in Scotch barbecue spices, ideal for sharing.',
  'Mixed Grill Gumbo Platter': 'A feast of grilled beef, lamb, pork, and chicken served family-style.',

  // SIZZLING SPECIALS
  'MacSizzle\'s Pork Hot Plate (Sokomoko)': 'Tender pork cubes marinated, grilled, and served sizzling with fresh kachumbari.',
  'MacSizzle\'s Lamb Hot Plate (Baraduli)': 'Succulent lamb cubes grilled and served on a sizzling hot plate.',
  'MacSizzle\'s Beef Qalwale Hot Plate (Bull Fighter)': 'Flavorful beef cubes grilled and finished with fresh vegetables and kachumbari.',
  'MacSizzles Mixed Grill Platter': 'A combination of beef, lamb, and pork sizzling specialties served with your choice of accompaniment.',

  // DESSERTS
  'MacMichael\'s Black Forest Cake': 'Layers of chocolate sponge cake soaked in cherry syrup and topped with whipped cream and chocolate flakes.',
  'MacPherson\'s Scotch Cones': 'Flaky pastry cones filled with black currant compote and served with cream or jam.',
  'MacKenzie\'s Trifle': 'Layers of sponge cake, fruit, custard, cream, and sherry served in a dessert glass.',
  'MacDouvel\'s Fruit Salad in Season': 'A refreshing selection of locally sourced tropical fruits served chilled.',
  'MacClean\'s Cream Caramel': 'Silky baked vanilla custard topped with golden caramel sauce.',
  'MacColl\'s Marbelled Cake': 'Moist vanilla and chocolate sponge cake swirled together.',
  'MacAdam\'s Banana Split': 'Fresh banana served with three scoops of ice cream, whipped cream, and sweet toppings.',

  // SALADS
  'Coleslaw': 'Freshly prepared cabbage and carrot salad in a creamy dressing.',
  'Mixed Salad': 'A colorful blend of fresh garden vegetables and seasonal greens.',
  'Fruit Salad': 'A refreshing assortment of freshly cut seasonal fruits.',
  'Vegetable Salad': 'A selection of crisp seasonal vegetables lightly dressed.'
};

async function execute() {
  const { data: dbItems, error: fetchErr } = await supabase.from('menu_items').select('id, title');
  if (fetchErr) {
    console.error("Fetch DB error:", fetchErr);
    return;
  }
  
  let count = 0;
  for (const dbItem of dbItems || []) {
    let updateDesc = null;

    // Check exact match first
    if (sqlMapping[dbItem.title]) {
      updateDesc = sqlMapping[dbItem.title];
    } else {
      // Check partial match fallback
      for (const [key, desc] of Object.entries(sqlMapping)) {
        if (dbItem.title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(dbItem.title.toLowerCase())) {
          updateDesc = desc;
          break;
        }
      }
    }

    if (updateDesc) {
      const { error: updErr } = await supabase.from('menu_items').update({ description: updateDesc }).eq('id', dbItem.id);
      if (updErr) {
        console.error(`Failed to update ${dbItem.title}:`, updErr);
      } else {
        count++;
        console.log(`Updated: ${dbItem.title}`);
      }
    } else {
      console.log(`No match for: ${dbItem.title}`);
    }
  }
  console.log(`Successfully updated ${count} items.`);
}

execute();
