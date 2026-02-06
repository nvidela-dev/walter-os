This is a project to help my mom with her responsabilities, most importantly her accounting and her business

The homepage should look like a phone home with the pages being "apps"

The backend should all be in spanish, but the frontend should be in english.

For now, in the version we're starting to develop, we will only manage the business.

The business is a restaurant, so the "Apps" will be the following

"Providers"

- Name
- Description
- Logo
- Debt
- A list of products n a n relationship, but the provider sells the product at a certain price

"Services"

- These are fixed prices like electricity bill, water, etc.
"House Expenses" -> Even if this is not part of the business, its deffinitely part of the accountability pipeline
- Very similar to services
"Employees"
- Their schedule
- Their salary
- Their fixed hours
- Ability to add extra hours and $$$ paid
"Menu"
- Items from the menu and how much they are sold for, they will relate to a recipe
"Recipes"
- A recipe is a list of products needed to make a menu item + name + a description

For now, the whole app will be focused on the input of this data, and we wont worry about visualization, I am making this so I can encourage my mom to keep her books in a smart way.
This means that it is really really important to develop this with the phone in mind.
Also this needs good tooltips and explanations, and have a 60 year old in mind when it comes to sizes, and UX choices, this has to all be very guided and obvious.

This will be a:
A PWA
Next.js App
Hosted on Vercel
Neon for the db and drizzle to talk to it
Clerk for login

Check ~/Hangar/CLAUDE.md before starting and stricly follow the pattern of opening PRS to the repo. The first commit can be pushed to main to init
