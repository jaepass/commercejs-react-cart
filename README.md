# Commerce.js React Cart

Add cart functionality to your React application using Commerce.js.

## Overview

The goal of this guide is to demonstrate how to add cart functionality to your products page so multiple products can be added to a cart, increase or decrease the item quantities, and clear items from the cart.

Below is what you will accomplish with this guide:

1. Retrieve and/or create a cart in our application
2. Add products to cart
3. Update line items in cart
4. Remove line items from cart
5. Empty cart contents

[See live demo](https://commercejs-react-cart.netlify.app/)

## Requirements

To start this guide you will need:

- An IDE or code editor
- NodeJS, at least v8
- npm or yarn
- React devtools (recommended)

## Prerequisites

This project assumes you have some knowledge of the below concepts before starting:

- Basic knowledge of JavaScript
- Some knowledge of React
- An idea of the Jamstack architecture and how APIs work

### Some things to note

- The purpose of this guide is to focus on the Commerce.js integration and using React to build the application, we will therefore not be covering any styling details

## Add cart functionality

The [cart](https://commercejs.com/docs/sdk/cart/) resource in Chec comes equipped with multiple intuitive endpoints to help develop a seamless shopping cart experience with Commerce.js. You will be interacting with the cart endpoint in multiple components in your application:
- In your product listing page where you can add items to the cart
- In the cart component where you will be rendering, updating, removing, and clearing the cart items

### 1. Retrieve cart

In the app component, follow the same logic to fetch and retrieve your cart data after the component renders, the same as fetching your products. First let's add a cart state to store the cart data that will be returned under the products state.

```js
// App.js

const [cart, setCart] = useState({});
```

Next, we will use another Commerce method to retrieve the current cart in session with `cart.retrieve()`. Commerce.js automatically creates a cart for you if one does not exist in the current browser session. Commerce.js tracks the current cart ID with a cookie, and stores the entire cart and its contents for 30 days. This means that users returning to your website will still have their cart contents available for up to 30 days.

With the Cart API and cart methods in Commerce.js, the otherwise complex cart logic can be easily implemented. Now let's add a new cart method underneath `fetchProducts()`.

```js
/**
 * Retrieve the current cart or create one if one does not exist
 * https://commercejs.com/docs/sdk/cart
 */
const fetchCart = () => {
  commerce.cart.retrieve().then((cart) => {
    setCart(cart);
  }).catch((error) => {
    console.log('There was an error fetching the cart', error);
  });
}
```

Above, you created a new helper function called `fetchCart()` that will call the `cart.retrieve()` method to retrieve the cart in session or create a new one if one does not exist. When this method resolves, use `setCart` to set the returned cart data object to the cart state. Otherwise, handle a failed request with an error message. And again, we'll want to execute this method in the `useEffect` React hook to always make sure our most up to date cart data is returned.

```js
// App.js

useEffect(() => {
  fetchProducts();
  fetchCart();
}, []);
```

The `cart.retrieve()` method will run, resolve, and the returned data will be stored in the cart state. Fire up your page, and the result should be similar to the cart object response you see in the network request response.

### 2. Add to cart

The next functionality we will want to add is the ability to add products to a cart. We will be using the method `cart.add.` which calls the `POST v1/carts/{cart_id}` Cart API endpoint. With the cart object response, we can start to interact with and add the necessary event handlers to handle cart functionalities. Similar to how you can pass props as custom attributes, you can do that with native and custom events via callbacks. Because we will need to display a button to handle the add to cart functionality, let's go back to the `ProductItem.js` component to add that in the product card under the price element. Create a button tag and pass a function `handleAddToCart` to the React native `onClick` attribute which will be the function handler we will create to handle the event.

```jsx
<button
  name="Add to cart"
  className="product__btn"
  onClick={handleAddToCart}
>
  Quick add
</button>
```

In React, data being passed down from a parent component to a child component is called props. In order to listen for any events in a child component, use callback functions. After attaching a click event in your **Quick add** button to call the `handleAddToCart` event handler, now create the handler function.

```jsx
// ProductItem.js
const handleAddToCart = () => {
  onAddToCart(product.id, 1);
}
```

Inside the handler function `handleAddToCart()`, execute a callback function which will be passed in from the `App.js` component via props - `onAddToCart`. Note that you will get to creating and passing this callback in the next section. A callback can receive any arguments, and the `App.js` component will have access to them. In this case, pass `product.id` and the quantity `1` as these are the request parameters for using the `commerce.cart.add()` method.

Now go to `ProductsList.js` and attach the callback function to the `onAddToCart` attribute.

```js
// ProductsList.js

const ProductsList = ({ products, onAddToCart }) =>  (
  <div className="products" id="products">
    {products.map((product) => (
      <ProductItem
        key={product.id}
        product={product}
        onAddToCart={onAddToCart}
      />
    ))}
  </div>
);
```

Head back to `App.js` to pass in your callback `onAddToCart` in the `ProductsListing` component instance and attach a `handleAddToCart()` method and make the "add to cart" request to the Chec API.

```jsx
// App.js

<ProductsList
  products={products}
  onAddToCart={handleAddToCart}
/>
```

The data `product.id` and the quantity `1` that were passed in to the callback function in `ProductItem` component will be received in the handling method. Go ahead and create the helper handling method and call it `handleAddToCart()` in the `App.js` component. You will also need
to pass in parameters `productId` and `quantity` as variables.

```jsx
/**
 * Adds a product to the current cart in session
 * https://commercejs.com/docs/sdk/cart/#add-to-cart
 *
 * @param {string} productId The ID of the product being added
 * @param {number} quantity The quantity of the product being added
 */
const handleAddToCart = (productId, quantity) => {
  commerce.cart.add(productId, quantity).then((item) => {
    setCart(item.cart);
  }).catch((error) => {
    console.error('There was an error adding the item to the cart', error);
  });
}
```

The above helper handle makes a call to the `commerce.cart.add` method. You will also need to pass in parameters `productId` and `quantity` as variables for. When the promise resolves, we set the state again by updating the cart with the new cart data.

### 3. Create a cart component

Start by creating a cart component in the components folder. Here you will want to follow the same pattern to try to encapsulate and break down smaller components to be consumable by parent components. This way you continue to keep your application DRY as well and keep your logic separated.

In your components folder, create a `Cart.js` as a class component, this will render the main cart container.

```jsx
import React, { Component } from 'react';
import CartItem from './CartItem';

const Cart = ({ cart }) => {

  const handleEmptyCart = () => {
    onEmptyCart();
  }

  const renderEmptyMessage = () => {
    if (cart.total_unique_items > 0) {
      return;
    }

    return (
      <p className="cart__none">
        You have no items in your shopping cart, start adding some!
      </p>
    );
  }

  const renderItems = () => (
    cart.line_items.map((lineItem) => (
      <CartItem
        item={lineItem}
        key={lineItem.id}
        className="cart__inner"
      />
    ))
  );

  const renderTotal = () => (
    <div className="cart__total">
      <p className="cart__total-title">Subtotal:</p>
      <p className="cart__total-price">{cart.subtotal.formatted_with_symbol}</p>
    </div>
  );

  return (
    <div className="cart">
      <h4 className="cart__heading">Your Shopping Cart</h4>
      { renderEmptyMessage() }
      { renderItems() }
      { renderTotal() }
      <div className="cart__footer">
        <button className="cart__btn-empty">Empty cart</button>
        <button className="cart__btn-checkout">Checkout</button> 
      </div>
    </div>
  );
};

Cart.propTypes = {
    cart: PropTypes.object,
    onEmptyCart: () => {},
};

export default Cart;
```

In `Cart.js`, import in a `CartItem` component you will create next. You've now split up your rendering methods
into a couple of parts:

* Render a message when the cart is empty
* Render the contents of the cart when it is not empty
* Return the main component that calls the above two methods

To render an empty cart message, first check that the cart is empty and return early if it isn't. Use the
 `cart.total_unique_items` property to determine this. Return a simple paragraph tag with a message in it.

When rendering the cart you'll do the opposite check from `renderEmptyCart()` checking that the cart _does_ have items
in it, returning early if not. Next, you will want to render out the individual line items that exists in the cart
object when items are added to cart. You're rendering a `CartItem` component for each line item, providing the line
item object as the `item` prop, and assigning it a unique `key` with the line item's `id` property.

Next, render some cart subtotals. You can use the `cart.subtotal.formatted_with_symbol` property
to get the cart's subtotal with the currency symbol (e.g. `$19.95`). This property will be updated whenever your cart
object changes in the state, so your cart updates in real time!

Finally, we add a handler for empty the cart contents and pass that in to the `onClick` attribute.

### Create the cart item component

Next, create the `CartItem.js` class component which will render each line item details such as the item image, name, price, and quantity.

```jsx
// Cart.js

import React from 'react';
import PropTypes from 'prop-types';

const CartItem = ({ item }) => {

  return (
    <div className="cart-item">
      <img className="cart-item__image" src={item.image.url} alt={item.name} />
      <div className="cart-item__details">
        <h4 className="cart-item__details-name">{item.name}</h4>
        <div className="cart-item__details-qty">
          <p>{item.quantity}</p>
        </div>
        <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
      </div>
      <button
        type="button"
        className="cart-item__remove"
      >
        Remove
      </button>
    </div>
  );
};

CartItem.propTypes = {
    item: PropTypes.object,
};

export default CartItem;
```

For now, build out the JSX template with the `item` prop to parse `item.image.url` as the `src` value, the `item.name`, the `item.quanity` and the `item.line_total.formatted_with_symbol`. Later on, you will be adding events to the buttons above to have the functionality to update and remove each line item.

At this stage, you should be able to see a minimal cart component rendered out in your main application view. Let's continue to add more cart functionality and build a more detailed cart interface.

### 4. Update cart items

Going back to the `CartItem.js` component, you can start to implement the first cart line item action using the Commerce.js [method](https://commercejs.com/docs/sdk/cart#update-cart) `commerce.cart.update()`. This request uses the `PUT v1/carts/{cart_id}/items/{line_item_id}` API to update the quantity or variant for the line item ID in the cart. For this guide, you will only be working with the main variant of the product item.

Add a new handler in the `CartItem.js` component to call a callback function `onUpdateCartQty`. Pass in `lineItemId` and `quantity` to this callback function.

```js
// CartItem.js

const handleUpdateCartQty = (lineItemId, quantity) => {
  onUpdateCartQty(lineItemId, quantity);
}
```

You've now created a handler function `handleUpdateCartQty()` to call a `onUpdateCartQty()` callback property. The parameters passed in will be available to the parent component, your `App.js` in this case, which will handle and execute the updating of line items in your cart.

Now in your CartItem component, hook up your "update cart quantity" functionality with a click handler. Between the item quantity element, attach your custom `handleUpdateCartQty` method to button click events. In the first button, implement a click handler to decrease the line item quantity by 1 and in the second button to increase it by 1.

```jsx
// CartItem.js
<div className="cart-item">
  <img className="cart-item__image" src={item.image.url} alt={item.name} />
  <div className="cart-item__details">
    <h4 className="cart-item__details-name">{item.name}</h4>
    <div className="cart-item__details-qty">
        <button type="button" onClick={() = handleUpdateCartQty(item.id, item.quantity - 1)}>-</button>
        <p>{item.quantity}</p>
        <button type="button" onClick={() => handleUpdateCartQty(item.id, item.quantity + 1)}>+</button>
    </div>
    <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
  </div>
  <button
    type="button"
    className="cart-item__remove"
  >
    Remove
  </button>
</div>
```

When the click event fires it will call the `handleUpdateCartQty()` method with the quantity
of the item decreased or increased by 1.

For the `App.js` component to handle the callback function, create an event handler for the updating of the line item quantities.

```jsx
// App.js

/**
 * Updates line_items in cart
 * https://commercejs.com/docs/sdk/cart/#update-cart
 *
 * @param {string} lineItemId ID of the cart line item being updated
 * @param {number} newQuantity New line item quantity to update
 */
const handleUpdateCartQty = (lineItemId, quantity) => {
  commerce.cart.update(lineItemId, { quantity }).then((resp) => {
    setCart(resp.cart);
  }).catch((error) => {
    console.log('There was an error updating the cart items', error);
  });
}
```

In this helper function, call the `commerce.cart.update()` endpoint with `lineItemId` and `quantity`. When you fire the update button in your `CartItem.js` component, this event handler will run and will update the state with the new cart object when it resolves.

Next, let's then get to creating a component for the cart header navigation and hook up your callback function as a prop to the `cart` component instance in this component. Name the file `CartNav.js`.

```js
const CartNav = ({ cart, onRemoveFromCart }) => {
  const [isCartVisible, setCartVisible] = useState(false);

  const renderOpenButton = () => (
    <button className="nav__cart-btn--open">
      <FontAwesomeIcon size="2x" icon="shopping-bag" color="#292B83"/>
      {cart !== null ? <span>{cart.total_items}</span> : ''}
    </button>
  );

  const renderCloseButton = () => (
    <button className="nav__cart-btn--close">
      <FontAwesomeIcon size="1x" icon="times" color="white"/>
    </button>
  );

  return (
    <div className="nav">
    <div className="nav__cart" onClick={() => setCartVisible(!isCartVisible)}>
        { !isCartVisible ? renderOpenButton() : renderCloseButton() }
    </div>
      { isCartVisible &&
        <Cart
          cart={cart}
          onUpdateCartQty={handleUpdateCartQty}
        />
      }  
    </div>
  );
};

export default CartNav;
```

Now update your `App.js` with the `CartNav` component instance.

```jsx
<CartNav 
  cart={cart}
  onUpdateCartQty={handleUpdateCartQty}
/>
```

Go ahead and click an update button for one of the line items. Upon a successful request you will see a successful network request event `Cart.Item.Updated` fired.

### 5. Remove items from cart

Now that you have the ability to update the quantity of individual line items in your cart, it's a good idea to let customers remove line items from your cart entirely. The Commerce.js `commerce.cart.remove()` [method](https://commercejs.com/docs/sdk/cart#remove-from-cart) helps with this.

Go back to your `CartItem.js` component to add the "remove item from cart" logic. Underneath `handleUpdateCartQty()`, add a helper method and call it `handleRemoveFromCart()`.

```js
// CartItem.js

const handleRemoveFromCart = () => {
  onRemoveFromCart(item.id);
}
```

Once again, this handler method will be the one to call a `onRemoveFromCart()` callback function which will make the `lineItemId` data available to the `App.js` component for which line item is being removed. An updated `CartItem.js` component with added handlers both bound to the component will look like this:

```jsx
const handleUpdateCartQty = (lineItemId, quantity) => {
  onUpdateCartQty(lineItemId, quantity);
}

const handleRemoveFromCart = () => {
  onRemoveFromCart(item.id);
}
```

Attach the `handleRemoveFromCart()` method to an isolated **Remove** button as well. When this click handler fires, the associated line item will be removed from the cart object.

```jsx
// CartItem.js

return (
  <div className="cart-item">
    <img className="cart-item__image" src={item.image.url} alt={item.name} />
    <div className="cart-item__details">
      <h4 className="cart-item__details-name">{item.name}</h4>
      <div className="cart-item__details-qty">
        <button type="button" onClick={() => item.quantity > 1 ? handleUpdateCartQty(item.id, item.quantity - 1) : handleRemoveFromCart()}>-</button>
        <p>{item.quantity}</p>
        <button type="button" onClick={() => handleUpdateCartQty(item.id, item.quantity + 1)}>+</button>
      </div>
      <div className="cart-item__details-price">{item.line_total.formatted_with_symbol}</div>
    </div>
    <button
      type="button"
      className="cart-item__remove"
      onClick={handleRemoveFromCart}
    >
      Remove
    </button>
  </div>
```

Finally, in `App.js`, create the event handler to make the request to the `commerce.cart.remove()` method. This is the event handler you
pass to your `CartItem` in the `onRemoveFromCart` prop. The `commerce.cart.remove()` method takes an `lineItemId` argument and once the promise resolves, the new cart object has one less of the removed line item (or the item removed entirely if you decrease down to a quantity of zero).

```js
// App.js

/**
 * Removes line item from cart
 * https://commercejs.com/docs/sdk/cart/#remove-from-cart
 *
 * @param {string} lineItemId ID of the line item being removed
 */
const handleRemoveFromCart = (lineItemId) => {
  commerce.cart.remove(lineItemId).then((resp) => {
    setCart(resp.cart);
  }).catch((error) => {
    console.error('There was an error removing the item from the cart', error);
  });
}
```

Update your `App` component to provide the `onRemoveFromCart` prop to the `Cart` component.

```jsx
// App.js
  <CartNav 
    cart={cart}
    onUpdateCartQty={handleUpdateCartQty}
    onRemoveFromCart={handleRemoveFromCart
  />
```
### 6. Clear cart

Lastly, the cart action to go over in this guide is the `commerce.cart.empty()`
[method](https://commercejs.com/docs/sdk/cart#empty-cart). The `empty()` method completely clears the contents of the current cart.

Since removal of the entire cart contents will happen at the cart component level, intercept an event for it directly in the cart UI. Go back to your `Cart` component and add a click handler which will call `handleEmptyCart()`. Underneath the component instance of `CartItem`, add in the button below:

```jsx
// Cart.js

<button className="cart__btn-empty" onClick={handleEmptyCart}>Empty cart</button>
```

Now, add a new handler method in the `Cart.js` component to call the callback prop `onEmptyCart` that will be passed down from `App.js`.

```jsx
// Cart.js

const handleEmptyCart = () => {
  onEmptyCart();
}
```

In `App.js`, create an event handler to empty the cart. The `commerce.cart.empty()` method has no arguments - it simply deletes all the items in the cart.

```jsx
// App.js

/**
 * Empties cart contents
 * https://commercejs.com/docs/sdk/cart/#remove-from-cart
 */
const handleEmptyCart = () => {
  commerce.cart.empty().then((resp) => {
    setCart(resp.cart);
  }).catch((error) => {
    console.error('There was an error emptying the cart', error);
  });
}
```

Continue to go up to the parent `CartNav.js` component to attach the callback.

```jsx
// CartNav.js

{isCartVisible &&
  <Cart
    cart={cart}
    onUpdateCartQty={onUpdateCartQty}
    onRemoveFromCart={onRemoveFromCart}
    onEmptyCart={onEmptyCart}
  />
}  
```

You'll need to hook it up to your cart component in your app component as well.

```jsx
// App.js

return (
  <div className="app">
    <CartNav 
      cart={cart}
      onUpdateCartQty={handleUpdateCartQty}
      onRemoveFromCart={handleRemoveFromCart}
      onEmptyCart={handleEmptyCart}
    />
  </div>
);
```

## That's it!

And there you have it, you have now wrapped up part two of the Commerce.js React guide on implementing cart
functionality in your application. The next guide will continue from this to add a checkout flow.

You can find the full finished code in [GitHub here](https://github.com/jaepass/commercejs-react-cart)!
